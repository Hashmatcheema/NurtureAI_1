import os
import numpy as np
import librosa
import torch
from torchvision import models, transforms
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from starlette.responses import JSONResponse

app = FastAPI()

# Define the class mapping
class_mapping = {
    'hu': 'hungry',
    'bu': 'needs burping',
    'bp': 'belly pain',
    'dc': 'discomfort',
    'ti': 'tired',
    'dk': 'dont know'
}

def create_spectrogram(audio_path, n_mels=128, n_fft=2048, hop_length=512):
    """Create a spectrogram from an audio file"""
    y, sr = librosa.load(audio_path, sr=None)
    mel_spec = librosa.feature.melspectrogram(
        y=y, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length
    )
    log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
    return log_mel_spec, sr

def normalize_spectrogram(spec):
    """Normalize spectrogram for image conversion"""
    spec_norm = (spec - np.min(spec)) / (np.max(spec) - np.min(spec))
    spec_norm = (spec_norm * 255).astype(np.uint8)
    return spec_norm

def predict_single_audio(audio_path, model_path='baby_cry_classifier.pth'):
    """Make a prediction on a single audio file"""
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    spec, _ = create_spectrogram(audio_path)
    spec_norm = normalize_spectrogram(spec)
    spec_image = Image.fromarray(spec_norm).convert('RGB')
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    spec_tensor = transform(spec_image).unsqueeze(0).to(device)
    
    model = models.resnet18(pretrained=False)
    num_classes = len(class_mapping)
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    
    with torch.no_grad():
        output = model(spec_tensor)
        _, predicted = torch.max(output, 1)
        probs = torch.nn.functional.softmax(output, dim=1)
    
    pred_idx = predicted.item()
    idx_to_label = {idx: label for idx, label in enumerate(class_mapping.keys())}
    pred_label = idx_to_label[pred_idx]
    pred_class = class_mapping[pred_label]
    confidence = probs[0][pred_idx].item()
    
    return pred_class, confidence

@app.post("/audio")
async def classify_audio(file: UploadFile = File(...)):
    """Endpoint to classify baby cry audio"""
    try:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        pred_class, confidence = predict_single_audio(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return JSONResponse(content={
            "category": pred_class,
            "confidence": confidence,
            "timestamp": str(librosa.util.time.time())
        })
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)