'use client'
import OverlayRenderer from './overlays/OverlayRenderer'

export default function PlayerOverlay({
    elements = [],
    currentTimeRef,
    containerRef,
    videoId,
    workspaceId,
    playerRef,
    viewerIdentityRef,
    onRouteSwap,
}) {
    return (
        <OverlayRenderer
            elements={elements}
            currentTimeRef={currentTimeRef}
            containerRef={containerRef}
            videoId={videoId}
            workspaceId={workspaceId}
            playerRef={playerRef}
            viewerIdentityRef={viewerIdentityRef}
            onRouteSwap={onRouteSwap}
        />
    )
}