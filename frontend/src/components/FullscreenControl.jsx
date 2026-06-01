import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function FullscreenControl() {
    const map = useMap();

    useEffect(() => {
        const FullscreenControlClass = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const button = L.DomUtil.create('a', 'leaflet-control-fullscreen', container);
                
                button.href = '#';
                button.title = 'Toggle Fullscreen';
                button.style.display = 'flex';
                button.style.justifyContent = 'center';
                button.style.alignItems = 'center';
                button.style.width = '30px';
                button.style.height = '30px';
                button.style.background = '#fff';
                button.style.color = '#333';
                button.style.textDecoration = 'none';
                button.style.fontSize = '18px';
                button.style.lineHeight = '30px';
                button.innerHTML = '⛶';

                // Prevent click from propagating to map
                L.DomEvent.disableClickPropagation(button);
                L.DomEvent.on(button, 'click', function (e) {
                    L.DomEvent.preventDefault(e);
                    const mapContainer = map.getContainer();

                    if (!document.fullscreenElement) {
                        if (mapContainer.requestFullscreen) {
                            mapContainer.requestFullscreen().catch(err => {
                                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                            });
                        } else if (mapContainer.webkitRequestFullscreen) { /* Safari */
                            mapContainer.webkitRequestFullscreen();
                        } else if (mapContainer.msRequestFullscreen) { /* IE11 */
                            mapContainer.msRequestFullscreen();
                        }
                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) { /* Safari */
                            document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) { /* IE11 */
                            document.msExitFullscreen();
                        }
                    }
                });

                // Update icon based on fullscreen state
                document.addEventListener('fullscreenchange', () => {
                    if (document.fullscreenElement) {
                        button.innerHTML = '◱';
                        button.title = 'Exit Fullscreen';
                    } else {
                        button.innerHTML = '⛶';
                        button.title = 'Toggle Fullscreen';
                    }
                });

                return container;
            }
        });

        const control = new FullscreenControlClass();
        map.addControl(control);

        return () => {
            map.removeControl(control);
        };
    }, [map]);

    return null;
}
