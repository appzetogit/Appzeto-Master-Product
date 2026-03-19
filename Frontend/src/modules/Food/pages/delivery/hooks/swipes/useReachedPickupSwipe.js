import { useCallback, useEffect } from "react";

export function useReachedPickupSwipe({
  reachedPickupButtonRef,
  reachedPickupSwipeStartX,
  reachedPickupSwipeStartY,
  reachedPickupIsSwiping,
  setreachedPickupIsAnimatingToComplete,
  setreachedPickupButtonProgress,
  setShowreachedPickupPopup,
  setShowOrderIdConfirmationPopup,
  selectedRestaurant,
  newOrder,
  deliveryAPI,
  debugLog,
  debugWarn,
  debugError,
  toast,
  setSelectedRestaurant,
  isDraggingReachedPickup,
  setIsDraggingReachedPickup,
}) {
  const getTouchPoint = (e) => {
    const touch = e?.touches?.[0] || e?.changedTouches?.[0];
    if (!touch) return null;
    return { x: touch.clientX, y: touch.clientY };
  };

  const handlereachedPickupTouchStart = useCallback((e) => {
    const touch = getTouchPoint(e);
    if (!touch) return;
    reachedPickupSwipeStartX.current = touch.x;
    reachedPickupSwipeStartY.current = touch.y;
    reachedPickupIsSwiping.current = false;
    setreachedPickupIsAnimatingToComplete(false);
    setreachedPickupButtonProgress(0);
  }, []);

  const handlereachedPickupTouchMove = useCallback((e) => {
    const touch = getTouchPoint(e);
    if (!touch) return;
    const deltaX = touch.x - reachedPickupSwipeStartX.current;
    const deltaY = touch.y - reachedPickupSwipeStartY.current;

    if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      reachedPickupIsSwiping.current = true;
      const buttonWidth = reachedPickupButtonRef.current?.offsetWidth || 300;
      const circleWidth = 56;
      const padding = 16;
      const maxSwipe = buttonWidth - circleWidth - padding * 2;
      const progress = Math.min(Math.max(deltaX / maxSwipe, 0), 1);
      setreachedPickupButtonProgress(progress);
    }
  }, []);

  const handlereachedPickupTouchEnd = useCallback((e) => {
    if (!reachedPickupIsSwiping.current) {
      setreachedPickupButtonProgress(0);
      return;
    }

    const touch = getTouchPoint(e);
    const deltaX = (touch?.x || reachedPickupSwipeStartX.current) - reachedPickupSwipeStartX.current;
    const buttonWidth = reachedPickupButtonRef.current?.offsetWidth || 300;
    const circleWidth = 56;
    const padding = 16;
    const maxSwipe = buttonWidth - circleWidth - padding * 2;
    const threshold = maxSwipe * 0.7;

    if (deltaX > threshold) {
      setreachedPickupIsAnimatingToComplete(true);
      setreachedPickupButtonProgress(1);

      setTimeout(async () => {
        setShowreachedPickupPopup(false);

        const orderId =
          selectedRestaurant?.orderId ||
          selectedRestaurant?.id ||
          newOrder?.orderId ||
          newOrder?.orderMongoId;

        const orderStatus = selectedRestaurant?.orderStatus || selectedRestaurant?.status || "";
        const deliveryPhase = selectedRestaurant?.deliveryPhase || selectedRestaurant?.deliveryState?.currentPhase || "";
        const deliveryStateStatus = selectedRestaurant?.deliveryState?.status || "";

        const isDelivered =
          orderStatus === "delivered" ||
          deliveryPhase === "completed" ||
          deliveryPhase === "delivered" ||
          deliveryStateStatus === "delivered";

        if (isDelivered) {
          debugWarn("Order is already delivered, skipping reached pickup confirmation");
          toast.error("Order is already delivered. Cannot confirm reached pickup.");
          setShowreachedPickupPopup(false);
          return;
        }

        const isPastPickupPhase =
          orderStatus === "out_for_delivery" ||
          deliveryPhase === "en_route_to_delivery" ||
          deliveryPhase === "picked_up" ||
          deliveryStateStatus === "order_confirmed" ||
          deliveryStateStatus === "reached_pickup" ||
          deliveryPhase === "at_pickup";

        if (isPastPickupPhase) {
          debugWarn("Order is already past pickup phase, skipping reached pickup confirmation");
          if (deliveryPhase === "at_pickup" || deliveryStateStatus === "reached_pickup") {
            setShowreachedPickupPopup(false);
            setTimeout(() => setShowOrderIdConfirmationPopup(true), 300);
            toast.info("Order is already at pickup. Showing order ID confirmation.");
          } else {
            toast.info("Order is already out for delivery.");
          }
          return;
        }

        if (orderId) {
          try {
            debugLog("Confirming reached pickup for order:", orderId);
            const response = await deliveryAPI.confirmReachedPickup(orderId);

            if (response.data?.success) {
              toast.success("Reached pickup confirmed!");
              setSelectedRestaurant((prev) => ({
                ...prev,
                deliveryState: {
                  ...(prev?.deliveryState || {}),
                  currentPhase: "at_pickup",
                  status: "reached_pickup",
                },
              }));
              setShowreachedPickupPopup(false);
              setTimeout(() => setShowOrderIdConfirmationPopup(true), 300);
            } else {
              debugError("Failed to confirm reached pickup:", response.data);
              toast.error(response.data?.message || "Failed to confirm reached pickup. Please try again.");
              setShowreachedPickupPopup(false);
              setTimeout(() => setShowOrderIdConfirmationPopup(true), 300);
            }
          } catch (error) {
            debugError("Error confirming reached pickup:", error);
            toast.error(
              error.response?.data?.message ||
                (error.response?.status === 404
                  ? "Order not found. Please refresh and try again."
                  : "Failed to confirm reached pickup. Please try again."),
            );
            setShowreachedPickupPopup(false);
            setTimeout(() => setShowOrderIdConfirmationPopup(true), 300);
          }
        } else {
          toast.error("Order ID not found. Please refresh and try again.");
          setShowreachedPickupPopup(false);
          setTimeout(() => setShowOrderIdConfirmationPopup(true), 300);
        }

        setTimeout(() => {
          setreachedPickupButtonProgress(0);
          setreachedPickupIsAnimatingToComplete(false);
        }, 500);
      }, 200);
    } else {
      setreachedPickupButtonProgress(0);
    }

    reachedPickupSwipeStartX.current = 0;
    reachedPickupSwipeStartY.current = 0;
    reachedPickupIsSwiping.current = false;
  }, []);

  const handlereachedPickupTouchCancel = useCallback(() => {
    reachedPickupSwipeStartX.current = 0;
    reachedPickupSwipeStartY.current = 0;
    reachedPickupIsSwiping.current = false;
    setreachedPickupButtonProgress(0);
    setreachedPickupIsAnimatingToComplete(false);
  }, []);

  const handleReachedPickupMouseDown = useCallback((e) => {
    reachedPickupSwipeStartX.current = e.clientX;
    reachedPickupSwipeStartY.current = e.clientY;
    reachedPickupIsSwiping.current = false;
    setIsDraggingReachedPickup(true);
    setreachedPickupIsAnimatingToComplete(false);
    setreachedPickupButtonProgress(0);
  }, []);

  const handleReachedPickupMouseMove = useCallback(
    (e) => {
      if (!isDraggingReachedPickup) return;
      const deltaX = e.clientX - reachedPickupSwipeStartX.current;
      const deltaY = e.clientY - reachedPickupSwipeStartY.current;

      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        reachedPickupIsSwiping.current = true;
        const buttonWidth = reachedPickupButtonRef.current?.offsetWidth || 300;
        const circleWidth = 56;
        const padding = 16;
        const maxSwipe = buttonWidth - circleWidth - padding * 2;
        const progress = Math.min(Math.max(deltaX / maxSwipe, 0), 1);
        setreachedPickupButtonProgress(progress);
      }
    },
    [isDraggingReachedPickup],
  );

  const handleReachedPickupMouseUp = useCallback(
    (e) => {
      if (!isDraggingReachedPickup) return;
      setIsDraggingReachedPickup(false);

      if (!reachedPickupIsSwiping.current) {
        setreachedPickupButtonProgress(0);
        return;
      }

      handlereachedPickupTouchEnd({
        changedTouches: [{ clientX: e.clientX, clientY: e.clientY }],
      });
    },
    [handlereachedPickupTouchEnd, isDraggingReachedPickup],
  );

  useEffect(() => {
    if (!isDraggingReachedPickup) return undefined;
    document.addEventListener("mousemove", handleReachedPickupMouseMove);
    document.addEventListener("mouseup", handleReachedPickupMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleReachedPickupMouseMove);
      document.removeEventListener("mouseup", handleReachedPickupMouseUp);
    };
  }, [handleReachedPickupMouseMove, handleReachedPickupMouseUp, isDraggingReachedPickup]);

  return {
    handlereachedPickupTouchStart,
    handlereachedPickupTouchMove,
    handlereachedPickupTouchEnd,
    handlereachedPickupTouchCancel,
    handleReachedPickupMouseDown,
  };
}

