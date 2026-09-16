import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@/lib/leaflet-icon';
import { projectTypeLabel } from '@/components/projects/project-type-select';
import type { PortfolioMapPin } from '@/types';

function FitBounds({ pins }: { pins: PortfolioMapPin[] }) {
    const map = useMap();
    const fitted = useRef(false);

    useEffect(() => {
        if (fitted.current || pins.length === 0) {
            return;
        }

        fitted.current = true;

        if (pins.length === 1) {
            map.setView([pins[0].latitude, pins[0].longitude], 12);
            return;
        }

        const bounds = L.latLngBounds(
            pins.map((pin) => [pin.latitude, pin.longitude]),
        );
        map.fitBounds(bounds, { padding: [32, 32] });
    }, [pins, map]);

    return null;
}

export function SiteMap({
    pins,
    height = 320,
}: {
    pins: PortfolioMapPin[];
    height?: number;
}) {
    if (pins.length === 0) {
        return (
            <div
                className="bg-muted/30 text-muted-foreground flex items-center justify-center rounded-lg border text-sm"
                style={{ height }}
            >
                No completed projects have a pinned location yet.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border">
            <MapContainer
                center={[pins[0].latitude, pins[0].longitude]}
                zoom={4}
                style={{ height, width: '100%' }}
                className="z-0"
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds pins={pins} />
                {pins.map((pin) => (
                    <Marker
                        key={pin.id}
                        position={[pin.latitude, pin.longitude]}
                    >
                        <Popup>
                            <span className="font-medium">{pin.name}</span>
                            <br />
                            <span className="text-muted-foreground text-xs">
                                {projectTypeLabel(pin.type)}
                            </span>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
