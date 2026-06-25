/**
 * Orchestriert das Einspielen einer generierten Zählung in DAVe.
 *
 * Ablauf (alle Aufrufe ohne Authentifizierung dank Backend-Profil `no-security`):
 *   1. POST /zaehlstelle/save                       – Zählstelle anlegen
 *   2. POST /zaehlung/saveWithZeitintervall          – Zählung + Zeitintervalle anlegen
 *
 * Schritt 2 legt die Zählung mit Status COUNTING an; das Backend vergibt die
 * IDs der Verkehrsbeziehungen und ordnet die mitgeschickten Zeitintervalle
 * anhand der Struktur (von/nach bzw. Knotenarm/Richtung/Straßenseite) zu.
 * Dadurch erscheint die Zählung als offene Zählung in Admin- und
 * Selfservice-Portal.
 */
import type { BackendIdDTO, UpdateStatusDTO } from "@/types/dave";
import type { GeneratorConfig } from "@/types/GeneratorConfig";

import { post } from "@/services/daveApi";
import { DIENSTLEISTERKENNUNG, buildZaehlstelleDto, buildZaehlungDto } from "@/util/daveMapping";

export interface UploadResult {
  zaehlstelleId: string;
  zaehlungId: string;
  zaehlstellennummer: string;
}

const ZAEHLSTELLE_ID_PARAM = "zaehlstelle_id";

export async function sendeAnDave(
  config: GeneratorConfig
): Promise<UploadResult> {
  // 1. Zählstelle anlegen
  const zaehlstelle = await post<BackendIdDTO>(
    "/zaehlstelle/save",
    buildZaehlstelleDto(config)
  );

  // 2. Zählung mit Zeitintervallen anlegen
  const zaehlung = await post<BackendIdDTO>(
    `/zaehlung/saveWithZeitintervall?${ZAEHLSTELLE_ID_PARAM}=${encodeURIComponent(
      zaehlstelle.id
    )}`,
    buildZaehlungDto(config)
  );

  return {
    zaehlstelleId: zaehlstelle.id,
    zaehlungId: zaehlung.id,
    zaehlstellennummer: config.zaehlstellennummer.trim(),
  };
}

/**
 * Schaltet den Status einer Zählung im DAVe-Workflow weiter
 * (POST /zaehlung/updateStatus). Steuert, in welchem Portal die Zählung
 * sichtbar ist (siehe Status-Modell im WorkflowStepper).
 *
 * Wirft {@link DaveApiError} – insbesondere HTTP 400 beim Übergang auf
 * ACCOMPLISHED, wenn die Plausibilitätsprüfung der Zeitintervalle fehlschlägt.
 */
export async function updateStatus(
  zaehlungId: string,
  status: string
): Promise<void> {
  const dto: UpdateStatusDTO = {
    zaehlungId,
    status,
    dienstleisterkennung: DIENSTLEISTERKENNUNG,
  };
  await post<BackendIdDTO>("/zaehlung/updateStatus", dto);
}
