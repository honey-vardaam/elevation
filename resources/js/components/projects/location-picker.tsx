import { type KeyboardEvent, useEffect, useState } from 'react';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import { Search } from 'lucide-react';
import '@/lib/leaflet-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

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

/** Recenters the map when a search result comes in - clicking/dragging the
 * pin shouldn't trigger this, only an explicit search should move the view. */
function FlyTo({ position }: { position: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 15);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position]);

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
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

    async function handleSearch() {
        const trimmed = query.trim();
        if (!trimmed) {
            return;
        }

        setSearching(true);
        setSearchError(null);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`,
            );

            if (!response.ok) {
                throw new Error('Search request failed.');
            }

            const results: { lat: string; lon: string }[] =
                await response.json();

            if (results.length === 0) {
                setSearchError('No matching location found.');
                return;
            }

            const position: [number, number] = [
                parseFloat(results[0].lat),
                parseFloat(results[0].lon),
            ];
            onChange(position[0], position[1]);
            setFlyTo(position);
        } catch {
            setSearchError('Could not search for that location.');
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className="space-y-2">
            {/* Not a <form>: this picker is always embedded inside the
                project form, and nested forms are invalid HTML - the browser
                drops the inner one, so a submit button here would silently
                submit (and close) the outer dialog instead of searching. */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSearchError(null);
                        }}
                        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleSearch();
                            }
                        }}
                        placeholder="Search for an address or place…"
                        className="pl-8"
                    />
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSearch}
                    disabled={searching || !query.trim()}
                >
                    {searching ? <Spinner /> : 'Search'}
                </Button>
            </div>

            {searchError && (
                <p className="text-destructive text-xs">{searchError}</p>
            )}

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
                    <FlyTo position={flyTo} />
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
                            Search above or click the map to drop a pin
                            (optional).
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
