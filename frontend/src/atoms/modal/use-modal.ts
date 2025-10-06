import { useCallback, useEffect, useState } from "react";

export interface ModalPosition {
  x: number;
  y: number;
}

export interface UseModalReturn {
  modals: string[];
  openModal: (modalId: string) => void;
  closeModal: (modalId?: string) => void;
  isModalOpen: (modalId: string) => boolean;
  getModalLevel: (modalId: string) => number;
  getModalPosition: (modalId: string) => ModalPosition;
  setModalPosition: (modalId: string, position: ModalPosition) => void;
  resetModalPosition: (modalId: string) => void;
}

export const useModal = (): UseModalReturn => {
  const [modals, setModals] = useState<string[]>([]);
  const [modalPositions, setModalPositions] = useState<
    Record<string, ModalPosition>
  >({});

  const openModal = useCallback((modalId: string) => {
    setModals((prev) => {
      if (prev.includes(modalId)) {
        return prev;
      }
      return [...prev, modalId];
    });
  }, []);

  const closeModal = useCallback((modalId?: string) => {
    setModals((prev) => {
      if (modalId) {
        // Clean up position when closing specific modal
        setModalPositions((positions) => {
          const newPositions = { ...positions };
          delete newPositions[modalId];
          return newPositions;
        });
        return prev.filter((id) => id !== modalId);
      }
      // Clean up position of last modal when closing
      const lastModal = prev[prev.length - 1];
      if (lastModal) {
        setModalPositions((positions) => {
          const newPositions = { ...positions };
          delete newPositions[lastModal];
          return newPositions;
        });
      }
      return prev.slice(0, -1);
    });
  }, []);

  const isModalOpen = useCallback(
    (modalId: string) => {
      return modals.includes(modalId);
    },
    [modals]
  );

  const getModalLevel = useCallback(
    (modalId: string) => {
      return modals.indexOf(modalId);
    },
    [modals]
  );

  const getModalPosition = useCallback(
    (modalId: string): ModalPosition => {
      return modalPositions[modalId] || { x: 0, y: 0 };
    },
    [modalPositions]
  );

  const setModalPosition = useCallback(
    (modalId: string, position: ModalPosition) => {
      setModalPositions((prev) => ({
        ...prev,
        [modalId]: position,
      }));
    },
    []
  );

  const resetModalPosition = useCallback((modalId: string) => {
    setModalPositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[modalId];
      return newPositions;
    });
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modals.length > 0) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modals.length]);

  return {
    modals,
    openModal,
    closeModal,
    isModalOpen,
    getModalLevel,
    getModalPosition,
    setModalPosition,
    resetModalPosition,
  };
};
