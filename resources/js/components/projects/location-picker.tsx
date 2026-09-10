import { useState } from 'react';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMapEvents,
} from 'react-leaflet';
import '@/lib/leaflet-icon';

function ClickHandler({
    onPick,
}: {
    onPick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });

    return null;
}

const DEFAULT_CENTER: [number, number] = [20, 0];

export function LocationPicker({
    latitude,
    longitude,
    onChange,
}: {
    latitude: number | null;
    longitude: number | null;
    onChange: (latitude: number | null, longitude: number | null) => void;
}) {
    const hasPin = latitude !== null && longitude !== null;
    const [initialCenter] = useState<[number, number]>(
        hasPin ? [latitude, longitude] : DEFAULT_CENTER,
    );

    return (
        <div className="overflow-hidden rounded-lg border">
            <MapContainer
                center={initialCenter}
                zoom={hasPin ? 13 : 2}
                style={{ height: 220, width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onPick={onChange} />
                {hasPin && (
                    <Marker
                        position={[latitude, longitude]}
                        draggable
                        eventHandlers={{
                            dragend: (event) => {
                                const position = event.target.getLatLng();
                                onChange(position.lat, position.lng);
                            },
                        }}
                    />
                )}
            </MapContainer>
            <div className="bg-muted/30 flex items-center justify-between border-t px-3 py-1.5 text-xs">
                {hasPin ? (
                    <>
                        <span className="text-muted-foreground">
                            {latitude.toFixed(5)}, {longitude.toFixed(5)}
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange(null, null)}
                            className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                            Clear pin
                        </button>
                    </>
                ) : (
                    <span className="text-muted-foreground">
                        Click the map to drop a pin for this site (optional).
                    </span>
                )}
            </div>
        </div>
    );
}
