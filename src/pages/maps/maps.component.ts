import { Component, OnInit } from '@angular/core';
import * as ol from 'openlayers';
import { MapService } from '../../services/map.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

@Component({
    selector: "map-open",
    templateUrl: './maps.component.html',
    styleUrls: ['./maps.component.css']
})

export class MapComponent implements OnInit {

    country = null;
    countryCodes = {};
    npsData = [];
    npsGeoIds = [];
    dispalyPopUp = true;
    latlog = [];
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
        this.mapService.getCountryCodes().subscribe((codes) => {
            this.countryCodes = codes;
            if (this.country) {
                this.dispalyPopUp = false;
                this.heighLightCountry();
            } else {
                this.npsDataAssign();
            }
        });
    }

    heighLightCountry() {
        let vectorLayer = new ol.layer.Vector({
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
        let layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        let map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            interactions: ol.interaction.defaults({ mouseWheelZoom: false, dragPan: false }),
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
                let value = [];
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
        let container = document.getElementById('popup');
        let content = document.getElementById('popup-content');
        let closer = document.getElementById('popup-closer');
        let overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        }));
        let vectorLayer = new ol.layer.Vector({
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

        let layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        let map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            overlays: [overlay],
            interactions: ol.interaction.defaults({ mouseWheelZoom: false, dragPan: false }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2.3
            })
        });

        closer.onclick = function () {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };

        map.on('singleclick', (evt) => {
            let coordinate = evt.coordinate;
            let source = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return { cityId: feature.getId('id'), name: feature.get('name') };
            });
            if (source && source.cityId && _.filter(this.npsData, { id: source.cityId }).length > 0) {
                let sou = _.filter(this.npsData, { id: source.cityId });
                let elements = '<div><h4 class="set-margincls">' + source.name + '</h2>'
                elements += '<table class="table table-hover">'
                elements += '<thead><tr><th>Date</th><th>actual</th><th>ytdActual</th></tr</thead><tbody>'
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