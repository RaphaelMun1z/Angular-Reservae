import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

const IBGE_LOCATIONS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export interface IbgeState {
  readonly uf: string;
  readonly name: string;
}

export interface IbgeCity {
  readonly id: number;
  readonly name: string;
}

@Injectable({ providedIn: 'root' })
export class IbgeLocationApi {
  private readonly http = inject(HttpClient);

  listStates(): Observable<readonly IbgeState[]> {
    return this.http.get<unknown>(`${IBGE_LOCATIONS_URL}/estados?orderBy=nome`).pipe(
      map((response) => Array.isArray(response) ? response.flatMap((item) => this.toState(item)) : []),
    );
  }

  listCities(uf: string): Observable<readonly IbgeCity[]> {
    return this.http.get<unknown>(`${IBGE_LOCATIONS_URL}/estados/${encodeURIComponent(uf)}/municipios`).pipe(
      map((response) => Array.isArray(response) ? response.flatMap((item) => this.toCity(item)) : []),
    );
  }

  private toState(value: unknown): IbgeState[] {
    if (!this.isRecord(value) || typeof value['sigla'] !== 'string' || typeof value['nome'] !== 'string') return [];
    return [{ uf: value['sigla'].toUpperCase(), name: value['nome'] }];
  }

  private toCity(value: unknown): IbgeCity[] {
    if (!this.isRecord(value) || typeof value['id'] !== 'number' || typeof value['nome'] !== 'string') return [];
    return [{ id: value['id'], name: value['nome'] }];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
