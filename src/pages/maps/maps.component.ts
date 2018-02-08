import { Component, OnInit } from '@angular/core';
import * as ol from 'openlayers';
import { MapService } from '../../services/map.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

@Component({
    selector: 'map-open',
    templateUrl: './maps.component.html',
    styleUrls: ['./maps.component.css']
})

export class MapComponent implements OnInit {

    country = null;
    countryCodes = {};
    npsData = [];
    npsGeoIds = [];
    dispalyPopUp = false;
    latlog = [];
    usStatesData = [];
    constructor(public mapService: MapService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.country = params['country'] ? params['country'] : null;
        });
        setTimeout(() => {
           if (this.country) {
              if (this.country.length === 3) {
                  this.country = this.country.substr(1);
               }
           }
            this.initialRequestWithOutSelectCountry();
        }, 500);
}

    initialRequestWithOutSelectCountry() {
      let mapdiv = document.getElementById('map-one');
        mapdiv.setAttribute('style', 'height:' + (window.outerHeight - 70) + 'px');
        window.addEventListener('resize', () => {
              mapdiv.setAttribute('style', 'height:' + (window.outerHeight - 70) + 'px');
         });
         if (this.country && this.country.toLowerCase() === 'us') {
            this.dispalyPopUp = true;
            this.mapService.getMissouri_fipsgeom().subscribe((us) => {
                this.usStatesData = us.periods;
                this.displaySelectedStates();
            });
        } else {
            this.mapService.getCountryCodes().subscribe((codes) => {
                this.countryCodes = codes;
                if (this.country) {
                    this.dispalyPopUp = false;
                    this.highlightCountry();
                } else {
                    this.dispalyPopUp = true;
                    this.npsDataAssign();
                }
            });
        }
    }

    displaySelectedStates(){
        const container = document.getElementById('popup');
        const content = document.getElementById('popup-content');
        const closer = document.getElementById('popup-closer');
        const overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        }));
        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'assets/missouri_fipsgeom.json',
                format: new ol.format.GeoJSON()
            }),
            style: (feature) => {
                if (_.filter(this.usStatesData, { country_code: feature.getProperties().l2_admincode }).length > 0) {
                    return new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: this.getRandomColor()
                        }),
                    });
                }
            }
        });
        const layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        const map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            overlays: [overlay],
            interactions: ol.interaction.defaults({ mouseWheelZoom: false, dragPan: false }),
            view: new ol.View({
                center: ol.proj.transform([-90.68542201, 38], 'EPSG:4326', 'EPSG:3857'),
                zoom: 5
            })
        });

        closer.onclick = function () {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };

        map.on('singleclick', (evt) => {
            const coordinate = evt.coordinate;
            const source = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return { country_code: feature.getProperties().l2_admincode, name: feature.getProperties().l2_admincode };
            });
            if (source && source.country_code && _.filter(this.usStatesData, { country_code: source.country_code }).length > 0) {
                const sou = _.filter(this.usStatesData, { country_code: source.country_code });
                let elements = '<div><h4 class="set-margincls">' + source.name + '</h2>';
                elements += '<table class="table table-hover">';
                elements += '<thead><tr><th>Date</th><th>Actual</th><th>YtdActual</th></tr</thead><tbody>';
                elements += '<tr><td>' + sou[0].periodDate + '</td>';
                elements += '<td>' + sou[0].actual + '</td>';
                elements += '<td>' + sou[0].ytdActual + '</td></tr>';
                elements += '</tbody></table></div>';
                content.innerHTML = elements;
                overlay.setPosition(coordinate);
            }
        });
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

    highlightCountry() {
        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'assets/countries.json',
                format: new ol.format.GeoJSON()
            }),
            style: (feature) => {
                if (feature.getId('id') === this.countryCodes[this.country.toUpperCase()]) {
                    return new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'blue'
                        }),
                    });
                }
            }
        });
        const layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        const map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            interactions: ol.interaction.defaults({ mouseWheelZoom: false }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2.3
            })
        });
    }

    npsDataAssign() {
        this.mapService.getNpsTotalYearData().subscribe((nps) => {
            nps.geo.forEach((v) => {
                if (this.npsGeoIds.indexOf(v.geoid) === -1) {
                    this.npsGeoIds.push(v.geoid);
                }
            });
            this.npsGeoIds.forEach((a) => {
                const value = [];
                nps.geo.forEach((b) => {
                    if (a === b.geoid) {
                        value.push(b);
                    }
                });
                this.npsData.push({
                    id: this.countryCodes[a],
                    source: value
                });
            });
            this.mapInitForNps();
        });
    }

    mapInitForNps() {
        const container = document.getElementById('popup');
        const content = document.getElementById('popup-content');
        const closer = document.getElementById('popup-closer');
        const overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        }));
        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'assets/countries.json',
                format: new ol.format.GeoJSON()
            }),
            style: (feature) => {
                if (_.filter(this.npsData, { id: feature.getId('id') }).length > 0) {
                    if (feature.getId('id') === 'ARG') {
                        return new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'blue'
                            }),
                        });
                    } else if (feature.getId('id') === 'BRA') {
                        return new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'green'
                            }),
                        });
                    } else if (feature.getId('id') === 'USA') {
                        return new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'yellow'
                            }),
                        });
                    }
                }
            }
        });

        const layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        const map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            overlays: [overlay],
            interactions: ol.interaction.defaults({ mouseWheelZoom: false }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2
            })
        });

        closer.onclick = function () {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };

        map.on('singleclick', (evt) => {
            const coordinate = evt.coordinate;
            const source = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return { cityId: feature.getId('id'), name: feature.get('name') };
            });
            if (source && source.cityId && _.filter(this.npsData, { id: source.cityId }).length > 0) {
                const sou = _.filter(this.npsData, { id: source.cityId });
                let elements = '<div><h5 class="set-margincls">' + source.name + '</h5>';
                elements += '<table class="table table-hover">';
                elements += '<thead><tr><th>Date</th><th>Actual</th><th>YtdActual</th></tr></thead><tbody>';
                sou[0].source.forEach((val) => {
                    elements += '<tr><td>' + val.periodDate + '</td>';
                    elements += '<td>' + val.actual + '</td>';
                    elements += '<td>' + val.ytdActual + '</td></tr>';
                });
                elements += '</tbody></table></div>';
                content.innerHTML = elements;
                overlay.setPosition(coordinate);
            }
        });
    }
}
