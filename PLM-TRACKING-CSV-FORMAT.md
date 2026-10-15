# PLM Tracking Sample CSV Format

Each `TrackingSample.csvData` is a comma-separated string. `fields[0]` is the event
type and determines the schema. The event timestamp comes from `PackedSample.timestamp`
(nanoseconds → seconds: `timestamp / 1e9`). Descriptions are always last and may
contain commas.

---

## Event types

| EventType            | fields[1]               | fields[2]                              | fields[3]              | fields[4…]            |
|----------------------|-------------------------|----------------------------------------|------------------------|-----------------------|
| `SIGNAL_DECLARE`     | id                      | name                                   | unit                   | sampleRateHz          |
| `SIGNAL_DATA`        | id                      | value                                  |                        |                       |
| `PROCEDURE_START`    | id                      | name                                   |                        |                       |
| `PROCEDURE_END`      | id                      |                                        |                        |                       |
| `PROCEDURE_ACTION`   | procedureId             | `correct`\|`incorrect`\|`timeout`      | label                  | description *(opt.)*  |
| `SYSTEM_MARKER`      | `auto`\|`manual`        | label                                  | description *(opt.)*   |                       |
| `INCIDENT_MARKER`    | `critical`\|`moderate`  | label                                  | description *(opt.)*   |                       |

---

## Examples

```
SIGNAL_DECLARE,heart-rate,Fréquence cardiaque,bpm,50
SIGNAL_DECLARE,respiration,Respiration,br/min,50
SIGNAL_DECLARE,skin-conductance,Conductance cutanée,μS,50

SIGNAL_DATA,heart-rate,76.3

PROCEDURE_START,preparation,Préparation & EPI
PROCEDURE_ACTION,preparation,correct,Blouse enfilée
PROCEDURE_ACTION,preparation,incorrect,Lunettes de protection manquantes,Manipulation sans protection oculaire
PROCEDURE_ACTION,preparation,correct,Gants nitrile enfilés
PROCEDURE_END,preparation

PROCEDURE_START,dilution-acide,Dilution acide
PROCEDURE_ACTION,dilution-acide,correct,Eau versée en premier
PROCEDURE_ACTION,dilution-acide,timeout,Temps de mélange dépassé
PROCEDURE_ACTION,dilution-acide,incorrect,Mauvaise verrerie utilisée
PROCEDURE_END,dilution-acide

SYSTEM_MARKER,auto,Point de sauvegarde
SYSTEM_MARKER,manual,Observation formateur,Hésitation sur le choix de la verrerie

INCIDENT_MARKER,moderate,Erreur EPI: lunettes manquantes,Manipulation commencée sans protection oculaire
INCIDENT_MARKER,critical,Projection acide sur paillasse,Éclaboussure lors du mélange, risque de contamination
```

> A `PROCEDURE_START` with no matching `PROCEDURE_END` is treated as lasting until
> the end of the record (`endTime = -1`).
>
> `SIGNAL_DECLARE` must appear before any `SIGNAL_DATA` row for the same signal ID.