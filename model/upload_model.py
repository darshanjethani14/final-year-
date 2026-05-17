import os
from huggingface_hub import HfApi

def main():
    print("🚀 Hugging Face Model Uploader")
    print("-" * 30)
    
    # User se token maangna
    token = input("👉 Apna Hugging Face Token paste karein (Write permission wala): ").strip()
    
    if not token:
        print("❌ Token empty hai. Please token paste karein.")
        return

    try:
        api = HfApi(token=token)
        
        folder_path = r'd:\FYP BASED IELTS MOCK\FYP BASED IELTS\model\Final_Speaking_Model'
        repo_id = 'darshanjethani1/Final_Speaking_Model'
        
        print("\n⏳ Upload shuru ho raha hai... (Isme 10-20 minute lag sakte hain badi file ki wajah se, please wait karein)")
        
        api.upload_folder(
            folder_path=folder_path,
            repo_id=repo_id,
            repo_type='model'
        )
        print("\n✅ UPLOAD SUCCESSFUL! Aapka model Hugging Face par upload ho gaya hai.")
        
    except Exception as e:
        print(f"\n❌ Error aagaya: {e}")

if __name__ == "__main__":
    main()
