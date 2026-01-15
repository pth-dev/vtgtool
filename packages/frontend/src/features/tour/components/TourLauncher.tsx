/**
 * Tour Launcher Component
 * Button/menu to start guided tours
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  HelpOutline,
  PlayArrow,
  CheckCircle,
  Dashboard,
  Storage,
  Inventory,
  Psychology,
  RocketLaunch,
  Close,
} from '@mui/icons-material';
import { useTour } from '../hooks/useTour';
import { TOURS } from '../tourConfig';
import type { Tour } from '../types';

// Icon mapping
const ICONS: Record<string, React.ReactNode> = {
  RocketLaunch: <RocketLaunch />,
  Dashboard: <Dashboard />,
  Storage: <Storage />,
  Inventory: <Inventory />,
  Psychology: <Psychology />,
  PlayArrow: <PlayArrow />,
};

interface TourLauncherProps {
  collapsed?: boolean;
  variant?: 'button' | 'icon';
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  collapsed = false,
  variant = 'button',
}) => {
  const [open, setOpen] = useState(false);
  const { startTour, isTourCompleted, isActive } = useTour();

  const handleStartTour = (tourId: string) => {
    setOpen(false);
    // Small delay to let dialog close animation complete
    setTimeout(() => {
      startTour(tourId);
    }, 200);
  };

  const completedCount = TOURS.filter(t => isTourCompleted(t.id)).length;
  const progress = Math.round((completedCount / TOURS.length) * 100);

  const renderTourItem = (tour: Tour) => {
    const isCompleted = isTourCompleted(tour.id);
    const icon = tour.icon ? ICONS[tour.icon] : <PlayArrow />;

    return (
      <ListItemButton
        key={tour.id}
        onClick={() => handleStartTour(tour.id)}
        disabled={isActive}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          bgcolor: isCompleted ? 'success.50' : 'transparent',
          '&:hover': {
            bgcolor: isCompleted ? 'success.100' : 'action.hover',
          },
        }}
      >
        <ListItemIcon sx={{ color: isCompleted ? 'success.main' : 'primary.main' }}>
          {isCompleted ? <CheckCircle /> : icon}
        </ListItemIcon>
        <ListItemText
          primary={tour.name}
          secondary={tour.description}
          primaryTypographyProps={{
            fontWeight: 600,
            fontSize: 14,
          }}
          secondaryTypographyProps={{
            fontSize: 12,
            noWrap: true,
          }}
        />
        {tour.estimatedTime && (
          <Chip
            label={`${tour.estimatedTime} min`}
            size="small"
            variant="outlined"
            sx={{ ml: 1, fontSize: 11 }}
          />
        )}
      </ListItemButton>
    );
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Guided Tours">
          <IconButton
            onClick={() => setOpen(true)}
            data-tour-id="tour-launcher"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <HelpOutline />
          </IconButton>
        </Tooltip>
        <TourDialog
          open={open}
          onClose={() => setOpen(false)}
          tours={TOURS}
          progress={progress}
          completedCount={completedCount}
          renderTourItem={renderTourItem}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        startIcon={!collapsed && <HelpOutline />}
        data-tour-id="tour-launcher"
        sx={{
          minWidth: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {collapsed ? <HelpOutline /> : 'Guided Tours'}
      </Button>
      <TourDialog
        open={open}
        onClose={() => setOpen(false)}
        tours={TOURS}
        progress={progress}
        completedCount={completedCount}
        renderTourItem={renderTourItem}
      />
    </>
  );
};

interface TourDialogProps {
  open: boolean;
  onClose: () => void;
  tours: Tour[];
  progress: number;
  completedCount: number;
  renderTourItem: (tour: Tour) => React.ReactNode;
}

const TourDialog: React.FC<TourDialogProps> = ({
  open,
  onClose,
  tours,
  progress,
  completedCount,
  renderTourItem,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutline color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Guided Tours
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Progress */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: progress === 100 ? 'success.main' : 'primary.main',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {progress}%
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {completedCount === tours.length ? '🎉 All Tours Completed!' : 'Your Progress'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {tours.length} tours completed
            </Typography>
          </Box>
        </Box>

        {/* Tour List */}
        <List disablePadding>
          {tours.map(renderTourItem)}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default TourLauncher;
