import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { CookieService } from 'angular2-cookie/core';
import { Observable } from 'rxjs/Rx';
import { environment } from '../environments/environment';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class MapService {
    authToken;
    headers;
    options: RequestOptions;
    constructor(public http: Http, private cookieService: CookieService) { }

    getToken() {
        return this.cookieService.get('sales - order - dashboard');
    }

    getHeaders() {
        return this.http.get('assets/credentials.json')
            .map(res => res.json())
            .map((creds) => {
                if (environment.production) {
                    this.authToken = 'Bearer ' + this.getToken();
                } else {
                    this.authToken = creds['token'];
                }
                this.headers = {
                    'Content-Type': 'text/event-stream', 'Authorization': this.authToken
                };
                this.options = new RequestOptions({ headers: this.headers });
            });

    }

    getMissouri_fipsgeom() {
        return this.http.get('assets/missouri_fipsgeom.json')
            .map((res: any) => res.json());
    }

    getNpsTotalYearData() {
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

}