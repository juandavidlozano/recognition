// rekognition.js

// Function to set up periodic image capture and detect objects
function setupPeriodicImageCapture() {
    const videoElement = document.getElementById('cameraFeed');
    const statusElement = document.getElementById('status'); // Element where the detection result will be displayed

    if (!videoElement) {
        console.error('Video element not found');
        return;
    }

    videoElement.oncanplay = function() {
        // Ensure video is playing before capturing images
        if (!videoElement.playing) {
            videoElement.play(); // Ensures video starts playing if it hasn't started
        }

        // Set an interval to capture images from the video feed every 10 seconds
        setInterval(() => captureImageAndDetectDog(videoElement, statusElement), 3000);
    };
}

// Function to capture an image from the video and detect objects using AWS Rekognition
function captureImageAndDetectDog(videoElement, statusElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        if (!blob) {
            console.error('Failed to create blob from canvas');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = function() {
            const arrayBuffer = reader.result;
            const bytes = new Uint8Array(arrayBuffer);
            detectDogInImage(bytes, (err, topLabels) => {
                if (err) {
                    console.error('Error detecting objects:', err);
                    statusElement.textContent = 'Model error: ' + err.message;
                    statusElement.style.color = 'red';
                } else {
                    updateLabelTable(topLabels);  // Call to update the table
                    statusElement.textContent = 'Detection complete. Check labels below.';
                    statusElement.style.color = 'green';
                }
            });
        };
        reader.readAsArrayBuffer(blob);
    }, 'image/jpeg');
}

function updateLabelTable(labels) {
    const tableBody = document.getElementById('labelTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows
    labels.forEach(label => {
        const row = tableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = label.Name;
        cell2.textContent = `${label.Confidence.toFixed(2)}%`;
    });
}

// Function to detect a dog in an image using Amazon Rekognition
function detectDogInImage(imageData, callback) {
    const rekognition = new AWS.Rekognition();
    const params = {
        Image: {
            Bytes: imageData
        },
        MaxLabels: 10,
        MinConfidence: 70
    };

    rekognition.detectLabels(params, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            // Extract the top 3 labels sorted by confidence
            const topLabels = data.Labels.sort((a, b) => b.Confidence - a.Confidence).slice(0, 3).map(label => ({
                Name: label.Name,
                Confidence: label.Confidence
            }));
            callback(null, topLabels);
        }
    });
}

// Initialize the periodic image capture as soon as the script is loaded
document.addEventListener('DOMContentLoaded', setupPeriodicImageCapture);

