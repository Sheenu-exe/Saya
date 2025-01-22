'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Upload, X, Eye, Folder, Plus, FolderOpen } from "lucide-react";
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '../firebase.config';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';

// Upload Dialog Component
const UploadDialog = ({ isOpen, onClose, onUploadComplete, selectedFolder = null }) => {
  const [files, setFiles] = useState([]);
  const [passcode, setPasscode] = useState('');
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const verifyFolderPassword = async (folderId, password) => {
    try {
      const folderRef = doc(firestore, 'folders', folderId);
      const folderDoc = await getDoc(folderRef);
      
      if (!folderDoc.exists()) {
        return false;
      }

      const folderData = folderDoc.data();
      return await bcrypt.compare(password, folderData.passwordHash);
    } catch (error) {
      console.error('Password verification error:', error);
      throw new Error('Error verifying password');
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select files to upload');
      return;
    }

    if (!selectedFolder && (!folderName || !passcode)) {
      setError('Please provide folder name and passcode');
      return;
    }

    setUploading(true);
    try {
      let folderId = selectedFolder?.id;

      if (!selectedFolder) {
        // Create new folder
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passcode, salt);

        const folderData = {
          name: folderName,
          userId: auth.currentUser.uid,
          photoCount: 0,
          createdAt: new Date(),
          passwordHash,
        };

        const folderRef = await addDoc(collection(firestore, 'folders'), folderData);
        folderId = folderRef.id;
      } else {
        // Verify passcode for existing folder
        const isPasswordCorrect = await verifyFolderPassword(selectedFolder.id, passcode);
        if (!isPasswordCorrect) {
          setError('Incorrect passcode');
          setUploading(false);
          return;
        }
      }

      // Upload files
      for (const file of files) {
        const storageRef = ref(storage, `photos/${auth.currentUser.uid}/${folderId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const photoUrl = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'photos'), {
          folderId,
          userId: auth.currentUser.uid,
          url: photoUrl,
          name: file.name,
          timestamp: new Date()
        });
      }

      // Update folder photo count
      const folderRef = doc(firestore, 'folders', folderId);
      const folderDoc = await getDoc(folderRef);
      await updateDoc(folderRef, {
        photoCount: (folderDoc.data().photoCount || 0) + files.length
      });

      onUploadComplete();
      onClose();
      setFiles([]);
      setPasscode('');
      setFolderName('');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedFolder ? `Upload to ${selectedFolder.name}` : 'Create New Vault'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="mt-1"
            />
          </div>

          {files.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Selected files:</p>
              {files.map((file, index) => (
                <div key={index} className="text-sm text-gray-700">{file.name}</div>
              ))}
            </div>
          )}

          {!selectedFolder && (
            <Input
              placeholder="New Folder Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          )}

          <Input
            type="password"
            placeholder={selectedFolder ? "Enter Folder Passcode" : "Set Folder Passcode"}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />

          <Button
            onClick={handleUpload}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={uploading}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {selectedFolder ? 'Upload to Folder' : 'Create Vault & Upload'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const PhotoVaultHome = () => {
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchFolders(user.uid);
      } else {
        router.push('/auth/signIn');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchFolders = async (userId) => {
    try {
      const foldersRef = collection(firestore, 'folders');
      const q = query(foldersRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const foldersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFolders(foldersData);
      setError('');
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Error fetching folders');
    }
  };

  const handleFolderClick = (folder) => {
    // Navigate to folder view or open folder dialog
    router.push(`/folder/${folder.id}`);
  };

  const handleNewVault = () => {
    setSelectedFolder(null);
    setShowUploadDialog(true);
  };

  const handleAddToFolder = (folder) => {
    setSelectedFolder(folder);
    setShowUploadDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Saya</h1>
          </div>
          <Button
            onClick={handleNewVault}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Vault
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Folder className="w-10 h-10 text-indigo-600" />
                        <Lock className="w-4 h-4 text-indigo-600 absolute -bottom-1 -right-1 bg-white rounded-xl" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{folder.name}</h2>
                        <p className="text-sm text-gray-500">{folder.photoCount || 0} photos</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleFolderClick(folder)}
                      className="w-full bg-white hover:bg-gray-50"
                      variant="outline"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Open Vault
                    </Button>
                    <Button
                      onClick={() => handleAddToFolder(folder)}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add Photos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <UploadDialog
          isOpen={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false);
            setSelectedFolder(null);
          }}
          onUploadComplete={() => fetchFolders(auth.currentUser.uid)}
          selectedFolder={selectedFolder}
        />
      </div>
    </div>
  );
};

export default PhotoVaultHome;