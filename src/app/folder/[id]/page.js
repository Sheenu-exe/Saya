'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lock, Image, Trash2, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, firestore, storage } from '@/app/firebase.config';
import bcrypt from 'bcryptjs';

// ImageCarousel Component
function ImageCarousel({ images, currentIndex, isOpen, onClose, onNext, onPrevious }) {
  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrevious, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="relative">
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90">
        <div className="relative flex items-center justify-center w-full min-h-[80vh]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={onPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={onNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center">
            <img
              src={currentImage?.url}
              alt={currentImage?.name}
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main FolderView Component
export default function FolderView() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.id;
  
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderData, setFolderData] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  
  useEffect(() => {
    if (!folderId) return;

    const checkAuthAndFolder = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signIn');
        return;
      }

      try {
        setLoading(true);
        const folderRef = doc(firestore, 'folders', folderId);
        const folderSnap = await getDoc(folderRef);
        
        if (!folderSnap.exists()) {
          router.push('/');
          return;
        }

        const data = folderSnap.data();
        setFolderData(data);
        
        if (data.userId !== auth.currentUser?.uid) {
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error loading folder:', err);
        setError('Error loading folder');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFolder();
  }, [folderId, router]);
  
  const loadPhotos = async () => {
    if (!folderId) return;

    try {
      setLoading(true);
      const photosRef = collection(firestore, 'photos');
      const q = query(photosRef, where('folderId', '==', folderId));
      const querySnapshot = await getDocs(q);
      
      const photoData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPhotos(photoData);
      setError('');
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Error loading photos');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyPassword = async () => {
    try {
      setLoading(true);
      const isValid = await bcrypt.compare(password, folderData.passwordHash);
      
      if (isValid) {
        setIsLocked(false);
        await loadPhotos();
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setError('Error verifying password');
    } finally {
      setLoading(false);
    }
  };
  
  const deletePhoto = async (photo) => {
    if (!folderId) return;

    try {
      setLoading(true);
      
      // Delete from Storage
      const storageRef = ref(storage, `photos/${auth.currentUser.uid}/${folderId}/${photo.name}`);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'photos', photo.id));
      
      // Update folder photo count
      const folderRef = doc(firestore, 'folders', folderId);
      const folderSnap = await getDoc(folderRef);
      await updateDoc(folderRef, {
        photoCount: Math.max((folderSnap.data().photoCount || 1) - 1, 0)
      });
      
      // Update UI
      setPhotos(photos.filter(p => p.id !== photo.id));
      
      // Close carousel if it's open
      if (isCarouselOpen) {
        setIsCarouselOpen(false);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Error deleting photo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
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
  
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Button>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Lock className="w-12 h-12 text-indigo-600" />
                <h2 className="text-xl font-semibold">Enter Password</h2>
                {folderData && (
                  <p className="text-gray-500 text-center">
                    Enter password to access {folderData.name}
                  </p>
                )}
                <Input
                  type="password"
                  placeholder="Folder password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  onClick={verifyPassword}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={!password || loading}
                >
                  Unlock Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/home')}
              variant="ghost"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vaults
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {folderData?.name}
            </h1>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <Card 
              key={photo.id} 
              className="bg-white/50 backdrop-blur-sm border-0 shadow-lg group"
            >
              <CardContent className="p-4">
                <div className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="object-cover w-full h-full rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {photo.name}
                </p>
              </CardContent>
            </Card>
          ))}
          
          {photos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500">
              <Image className="w-16 h-16 mb-4" />
              <p>No photos in this folder yet</p>
            </div>
          )}
        </div>

        <ImageCarousel
          images={photos}
          currentIndex={selectedImageIndex}
          isOpen={isCarouselOpen}
          onClose={() => setIsCarouselOpen(false)}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
        />
      </div>
    </div>
  );
}