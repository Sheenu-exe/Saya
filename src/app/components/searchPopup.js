import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { auth } from '../firebase.config';

const SearchPopup = ({ isOpen, onClose, onFolderSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const foldersCollection = collection(firestore, 'folders');
      const q = query(
        foldersCollection,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwner: doc.data().owner === auth.currentUser.email,
        isShared: doc.data().sharedWith && doc.data().sharedWith.includes(auth.currentUser.email)
      })).filter(folder => folder.isOwner || folder.isShared);

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching folders:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    onFolderSelect(folder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Search Image Folders</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter folder name"
            className="flex-grow border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="max-h-60 overflow-y-auto">
          {searchResults.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <p className="font-semibold">{folder.name}</p>
              <p className="text-sm text-gray-600">
                {folder.isOwner ? 'Owner' : 'Shared with you'}
              </p>
            </div>
          ))}
        </div>
        {searchResults.length === 0 && !isLoading && !error && (
          <p className="text-gray-600">No results found</p>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SearchPopup;