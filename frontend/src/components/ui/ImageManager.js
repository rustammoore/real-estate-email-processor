import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Card,
  CardMedia,
  Typography,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, OpenInFull as OpenInFullIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';
import { normalizeImages, sanitizeImages, optimizeImageFile } from '../../utils/images';
import api from '../../services/api';

/**
 * Centralized image manager with full CRUD semantics.
 * Modes: create | edit | view
 */
export default function ImageManager({
  value,
  onChange,
  mode = 'view', // 'create' | 'edit' | 'view'
  columns = 3,
  tileHeight = 280,
  dropzoneSize = 200,
}) {
  const initial = useMemo(() => normalizeImages(value), [value]);
  const [urls, setUrls] = useState(() => (initial.length ? initial : ['']));
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isReadOnly = mode === 'view';

  const commit = (next) => {
    const cleaned = sanitizeImages(next);
    setUrls(next);
    if (onChange) onChange(cleaned);
  };

  const handleUrlChange = (index, nextValue) => {
    const next = [...urls];
    next[index] = nextValue;
    commit(next);
  };

  const handleAdd = () => {
    commit([...urls, '']);
  };

  const handleRemove = (index) => {
    const next = urls.filter((_, i) => i !== index);
    commit(next.length ? next : ['']);
  };

  const moveUrl = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= urls.length || fromIndex === toIndex) return;
    const next = [...urls];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    commit(next);
  };

  const handleMoveUp = (index) => moveUrl(index, index - 1);
  const handleMoveDown = (index) => moveUrl(index, index + 1);

  const handleClickUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const processAndUploadFiles = useCallback(async (files) => {
    const picked = Array.from(files || []);
    if (picked.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Optimize sequentially to manage memory; update progress
      const optimizedBlobs = [];
      for (let i = 0; i < picked.length; i += 1) {
        const file = picked[i];
        try {
          const { blob } = await optimizeImageFile(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82,
            mimeType: 'image/jpeg',
          });
          const optimizedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'image'}.jpg`, { type: 'image/jpeg' });
          optimizedBlobs.push(optimizedFile);
        } catch (_) {
          // skip this file
        }
        setUploadProgress(Math.round(((i + 1) / picked.length) * 70)); // 0-70% for optimization
      }
      if (optimizedBlobs.length === 0) return;
      let urlsFromServer = [];
      try {
        urlsFromServer = await api.uploadImages(optimizedBlobs);
      } catch (err) {
        console.error('Image upload failed:', err);
        urlsFromServer = [];
      }
      setUploadProgress(100);
      if (urlsFromServer && urlsFromServer.length > 0) {
        commit([...urls.filter((u) => u.trim() !== ''), ...urlsFromServer]);
      }
    } finally {
      setTimeout(() => setIsUploading(false), 400);
    }
  }, [urls]);

  const handleFilesSelected = async (event) => {
    const files = event.target?.files;
    await processAndUploadFiles(files);
    // reset input so selecting the same file again triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt?.files;
    await processAndUploadFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // View: grid of images; clicking enlarges
  if (isReadOnly) {
    const images = sanitizeImages(urls);
    return (
      <>
        <Grid container spacing={1}>
          {images.map((src, i) => (
            <Grid item xs={12} sm={6} md={12 / columns} key={`${src}-${i}`}>
              <Card sx={{ position: 'relative', height: tileHeight, cursor: 'pointer' }} onClick={() => setPreviewUrl(src)}>
                <CardMedia component="img" image={src} alt={`Image ${i + 1}`} sx={{ height: '100%', objectFit: 'cover' }} />
                <Tooltip title="Expand">
                  <IconButton size="small" sx={{ position: 'absolute', right: 6, bottom: 6, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}>
                    <OpenInFullIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} maxWidth="md" fullWidth>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogContent dividers>
            {previewUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', height: 'auto' }} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewUrl(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Create/Edit: two-column layout with square dropzone on the left and inputs on the right
  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
      <Grid container spacing={0} alignItems="stretch" wrap="nowrap">
        {/* Left: Square dropzone */}
        <Grid item xs={12} sm="auto" md="auto">
          <Box
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClickUpload}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 1.5,
              cursor: 'pointer',
              bgcolor: 'background.default',
              '&:hover': { bgcolor: 'action.hover' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: '100%', sm: dropzoneSize },
              height: { xs: dropzoneSize, sm: dropzoneSize },
              maxWidth: '100%',
              mr: { xs: 0, sm: 1 },
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              Drag & drop images here
              <br />
              or click to upload & optimize
            </Typography>
          </Box>
          {isUploading && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Grid>

        {/* Right: URL inputs and actions with reordering */}
        <Grid item xs={12} sm>
          <Box>
            {urls.map((url, index) => (
              <Box key={`img-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                {String(url).trim() !== '' && (
                  <Card sx={{ width: 72, height: 54, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CardMedia component="img" image={url} alt={`Thumb ${index + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Card>
                )}
                <TextField
                  fullWidth
                  label={`Image URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  size="small"
                  margin="dense"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <IconButton onClick={() => handleMoveUp(index)} size="small" disabled={index === 0} title="Move up">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleMoveDown(index)} size="small" disabled={index === urls.length - 1} title="Move down">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                {urls.length > 1 && (
                  <IconButton onClick={() => handleRemove(index)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Button startIcon={<AddIcon />} onClick={handleAdd} variant="outlined" size="small">
                Add Another Image
              </Button>
              <Button onClick={handleClickUpload} variant="contained" size="small" disabled={isUploading}>
                Upload & Optimize Images
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}


