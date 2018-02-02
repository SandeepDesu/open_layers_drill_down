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
    country;
    npsGeoIds = [];
    customData = [];
    constructor(public mapService: MapService, private route: ActivatedRoute) { }
    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.country = params['country'] ? params['country'] : null;
        });
        if (this.country) {
            if (this.country.length === 3) {
                this.country = this.country.substr(1);
            }
        }
        this.initialRequestWithOutSelectCountry();
    }

    initialRequestWithOutSelectCountry() {
        this.mapService.getCountryCodes().subscribe((codes) => {
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
                    this.customData.push({
                        id: codes[a],
                        source: value
                    })
                });
                this.mapInit();
            });
        })

    }

    mapInit() {
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');
        var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        }));
        var style = new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.6)'
            }),
            stroke: new ol.style.Stroke({
                color: '#319FD3',
                width: 1
            }),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            })
        });
        let self = this;
        var vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'assets/countries.json',
                format: new ol.format.GeoJSON()
            }),
            style: function (feature) {
                if (_.filter(self.customData, { id: feature.getId('id') }).length > 0) {
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

        var layer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        var map = new ol.Map({
            layers: [layer, vectorLayer],
            target: 'map-one',
            overlays: [overlay],
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

        map.on('singleclick', function (evt) {
            var coordinate = evt.coordinate;
            var source = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return { cityId: feature.getId('id') };
            });
            if (source && source.cityId && _.filter(self.customData, { id: source.cityId }).length > 0) {
                let sou = _.filter(self.customData, { id: source.cityId });
                let elements = "";
                sou[0].source.forEach((val) => {
                   elements += '<div><p>Date : ' + val.periodDate + '</p></div><div><p>actual : ' + val.actual + '</p></div><div><p>ytdActual : ' + val.ytdActual + '</p></div>'
                });
                content.innerHTML = elements;
                overlay.setPosition(coordinate);
            }
        });
    }

}