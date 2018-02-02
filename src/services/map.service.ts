import { Injectable } from '@angular/core';

import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class MapService {

    constructor(public http: Http) { }

   getNpsTotalYearData(){
       return this.http.get('assets/nps_total_year_2017.json')
            .map((res: any) => res.json());
   }

    getCountriesCords() {
        return this.http.get('assets/countries.json')
            .map((res: any) => res.json());
    }

    getCountryCodes() {
        return this.http.get('assets/country_codes.json')
            .map((res: any) => res.json());
    }

    getCountryLatAndLAng() {
        return this.http.get('assets/country_code_latlong_array.json')
            .map((res: any) => res.json());
    }


}