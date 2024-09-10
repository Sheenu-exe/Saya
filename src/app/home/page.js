import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, updateDoc, arrayUnion, doc } from "firebase/firestore";
import { firestore } from "../firebase.config";
import UploadPopup from "../components/uploadPopup";
import { auth } from "../firebase.config";
const MainPage = () => {
  const [folders, setFolders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [showImages, setShowImages] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const currentUser = auth.currentUser

  // Ensure currentUser exists before fetching folders
  useEffect(() => {
    if (currentUser) {
      fetchFolders();
    }
  }, [currentUser]);

  // Fetch folders owned or shared with the current user
  const fetchFolders = async () => {
    try {
      const foldersCollection = collection(firestore, "folders");

      // Queries for owned and shared folders
      const ownedQuery = query(foldersCollection, where("owner", "==", currentUser.email));
      const sharedQuery = query(foldersCollection, where("sharedWith", "array-contains", currentUser.email));

      const [ownedSnapshot, sharedSnapshot] = await Promise.all([getDocs(ownedQuery), getDocs(sharedQuery)]);

      // Parsing data
      const ownedFolders = ownedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
      }));

      const sharedFolders = sharedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: false,
      }));

      setFolders([...ownedFolders, ...sharedFolders]);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setError("Failed to load folders. Please try again later.");
    }
  };

  // Handle selecting a folder and opening passcode input
  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setShowImages(false);
    setEnteredPasscode("");
    setError("");
  };

  // Validate the passcode and show images
  const handlePasscodeSubmit = () => {
    if (enteredPasscode === selectedFolder.passcode) {
      setShowImages(true);
      setError("");
    } else {
      setError("Incorrect passcode, please try again.");
    }
  };

  // Add a new folder
  const addFolder = async (folderName, photos, passcode) => {
    try {
      const foldersCollection = collection(firestore, "folders");
      const newFolder = {
        name: folderName,
        photos: photos,
        passcode: passcode,
        owner: currentUser.email,
        sharedWith: [],
      };
      const docRef = await addDoc(foldersCollection, newFolder);
      setFolders((prev) => [...prev, { id: docRef.id, ...newFolder, isOwner: true }]);
      setShowPopup(false);
    } catch (error) {
      console.error("Error adding new folder:", error);
      setError("Failed to add new folder. Please try again.");
    }
  };

  // Share a folder with another user
  const shareFolder = async (folderId, emailToShare) => {
    try {
      const folderRef = doc(firestore, "folders", folderId);
      await updateDoc(folderRef, {
        sharedWith: arrayUnion(emailToShare),
      });
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? { ...folder, sharedWith: [...(folder.sharedWith || []), emailToShare] }
            : folder
        )
      );
    } catch (error) {
      console.error("Error sharing folder:", error);
      setError("Failed to share folder. Please try again.");
    }
  };

  const closePasscodePopup = () => {
    setSelectedFolder(null);
    setEnteredPasscode("");
    setError("");
  };

  const closeImagesPopup = () => {
    setShowImages(false);
    setSelectedFolder(null);
  };

  // Handle folder search functionality
  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Filter folders based on search term
  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchTerm));

  return (
    <div className="bg-[#E4EFE7] min-h-screen w-full p-8">
      <h2 className="text-2xl mb-6">All Folders</h2>
      <div className="flex justify-between mb-6">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search folders"
            className="border p-2 mr-2"
            onChange={handleSearch}
            value={searchTerm}
          />
          <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={fetchFolders}>
            Refresh
          </button>
        </div>
        <button onClick={() => setShowPopup(true)} className="bg-green-500 text-white py-2 px-4 rounded">
          Upload Photos
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Folder Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            className="cursor-pointer bg-white shadow-md p-4 rounded"
            onClick={() => handleFolderClick(folder)}
          >
            <img
              src="https://img.icons8.com/ios-glyphs/90/000000/folder-invoices--v1.png"
              alt="folder icon"
              className="w-16 h-16 mx-auto mb-2"
            />
            <p className="text-center">{folder.name}</p>
            {folder.isOwner && <p className="text-xs text-center text-gray-500">Owner</p>}
            {!folder.isOwner && <p className="text-xs text-center text-gray-500">Shared</p>}
          </div>
        ))}
      </div>

      {/* Passcode Popup */}
      {selectedFolder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg relative">
            <button onClick={closePasscodePopup} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">
              ✕
            </button>
            <h2 className="text-xl mb-4">Enter Passcode for {selectedFolder.name}</h2>
            <input
              type="password"
              className="border p-2 mb-4 w-full"
              placeholder="Passcode"
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value)}
            />
            <button onClick={handlePasscodeSubmit} className="bg-green-500 text-white py-2 px-4 rounded">
              Submit
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      )}

      {/* Images Popup */}
      {showImages && selectedFolder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <button onClick={closeImagesPopup} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">
              ✕
            </button>
            <h2 className="text-xl mb-4">{selectedFolder.name} - Images</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedFolder.photos.map((photo, index) => (
                <img key={index} src={photo} alt={`Photo ${index + 1}`} className="w-full h-auto rounded shadow" />
              ))}
            </div>
          </div>
        </div>
      )}

      {showPopup && <UploadPopup setShowPopup={setShowPopup} addFolder={addFolder} />}
    </div>
  );
};

export default MainPage;
