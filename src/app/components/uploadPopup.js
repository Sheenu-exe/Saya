'use client'
import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { storage, firestore } from "../firebase.config";
import Cookies from "universal-cookie";
import { ThreeDots } from "react-loader-spinner";

const UploadPopup = ({ setShowPopup, addFolder }) => {
  const [folderName, setFolderName] = useState("");
  const [existingFolders, setExistingFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [photos, setPhotos] = useState([]);
  const [passcode, setPasscode] = useState("");
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const cookies = new Cookies();

  useEffect(() => {
    const fetchExistingFolders = async () => {
      const foldersCollection = collection(firestore, "folders");
      const folderSnapshot = await getDocs(foldersCollection);
      const folderList = folderSnapshot.docs.map((doc) => doc.id);
      setExistingFolders(folderList);
      cookies.set("folders", folderList, { path: "/" });
    };

    fetchExistingFolders();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
      setShowPasscodeInput(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFolder && !folderName) {
      alert("Please select an existing folder or create a new one.");
      return;
    }
  
    const folder = folderName || selectedFolder;
    const uploadedPhotos = [];
  
    try {
      setUploading(true);
      setUploadProgress(0);
  
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileRef = ref(storage, `photos/${folder}/${photo.name}`);
  
        const uploadTask = uploadBytesResumable(fileRef, photo);
  
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round((i / photos.length) * 100 + progress / photos.length));
          },
          (error) => {
            console.error("Error uploading photo:", error);
            setUploadError(error.message);
            setUploading(false);
          }
        );
  
        // Wait for upload to complete before proceeding
        await uploadTask;
  
        const downloadURL = await getDownloadURL(fileRef);
        uploadedPhotos.push(downloadURL);
      }
  
      const foldersCollection = collection(firestore, "folders");
      const folderDoc = doc(foldersCollection, folder);
      await setDoc(folderDoc, {
        name: folder,
        passcode: passcode,
        photos: uploadedPhotos,
      }, { merge: true });
  
      addFolder(folder, uploadedPhotos, passcode);
      setShowPopup(false);
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("An error occurred while uploading photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg relative">
        <button
          onClick={() => setShowPopup(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
        <h2 className="text-xl mb-4">Upload Photos</h2>
        <div>
          <label className="block mb-2">Select Folder or Create New:</label>
          <select
            className="border p-2 mb-4 w-full"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            disabled={folderName}
          >
            <option value="">Select Existing Folder</option>
            {existingFolders.map((folder, index) => (
              <option key={index} value={folder}>
                {folder}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="border p-2 mb-4 w-full"
            placeholder="Or create new folder"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            disabled={selectedFolder}
          />

          <input
            type="file"
            multiple
            className="mb-4"
            onChange={handleFileChange}
            accept="image/*"
          />

          {showPasscodeInput && (
            <input
              type="password"
              className="border p-2 mb-4 w-full"
              placeholder="Set a passcode for this folder"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          )}

          <button
            onClick={handleUpload}
            className="bg-green-500 text-white py-2 px-4 rounded"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <ThreeDots type="ThreeDots" color="#ffffff" height={80} width={80} />
                <p className="ml-4">{uploadProgress}%</p>
              </div>
            ) : (
              "Upload Photos"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPopup;