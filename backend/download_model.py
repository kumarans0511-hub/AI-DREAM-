import os
import urllib.request
import tarfile

DOWNLOAD_PATH = "/root/.cache/chroma/onnx_models/all-MiniLM-L6-v2"
URL = "https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz"

def main():
    os.makedirs(DOWNLOAD_PATH, exist_ok=True)
    archive_path = os.path.join(DOWNLOAD_PATH, "onnx.tar.gz")

    if not os.path.exists(archive_path):
        print(f"Downloading {URL} to {archive_path}...")
        urllib.request.urlretrieve(URL, archive_path)
        print("Download complete.")
    else:
        print("Archive already exists.")

    print("Extracting...")
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=DOWNLOAD_PATH)
    print("Extraction complete.")
    
    # Verify files
    files = os.listdir(os.path.join(DOWNLOAD_PATH, "onnx"))
    print(f"Extracted files: {files}")

if __name__ == "__main__":
    main()
