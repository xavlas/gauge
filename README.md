# Jauge Vintage

Une carte Lovelace personnalisée pour Home Assistant qui affiche un thermomètre animé façon écran TFT : un fichier JS unique, sans étape de build, entièrement configurable en YAML.

![screenshot](docs/preview.png)

## Installation

### Via HACS

```
1. HACS → menu (⋮) → Dépôts personnalisés (Custom repositories)
2. Ajouter l'URL du dépôt GitHub, catégorie "Lovelace"
3. Installer "Jauge Vintage" ; la ressource est ajoutée automatiquement
```

### Manuelle

```
1. Copier jauge-vintage-card.js dans /config/www/
2. Réglages → Tableaux de bord → Ressources → Ajouter
   URL: /local/jauge-vintage-card.js   Type: Module JavaScript
3. Ajouter la carte: type: custom:jauge-vintage-card
```

## Configuration

| Clé | Type | Défaut | Rôle |
|-----|------|--------|------|
| `entity` | string | — (requis) | Entité HA dont l'état est affiché |
| `title` | string | `TEMP` | Libellé en haut |
| `unit` | string | `°C` | Unité affichée |
| `min` / `max` | number | `0` / `45` | Bornes de l'échelle de graduations |
| `decimals` | number | `1` | Décimales de la valeur centrale |
| `height` | number | `350` | Hauteur de la carte en px (repère logique) |
| `colors.background` | string | `#000000` | Fond |
| `colors.needle` | string[] (2–3) | `["#990000","#ff3300","#ffff66"]` | Dégradé de l'aiguille |
| `colors.needle_glow` | string | `#ff3300` | Lueur de l'aiguille |
| `colors.value` | string | `#ffffff` | Couleur de la valeur |
| `colors.value_glow` | string | `#ffffff` | Lueur de la valeur |
| `colors.title` | string | `#ffd400` | Couleur du titre |
| `colors.ticks` | string | `#b4b4b4` | Couleur de base des graduations (fondu calculé) |
| `geometry.radius` | number | `430` | Rayon de l'échelle |
| `geometry.center_x` | number | `-180` | Centre X (repère logique) |
| `geometry.center_y` | number\|null | `null` | Centre Y ; `null` = `height/2` |
| `geometry.degrees_per_unit` | number | `4` | Degrés entre deux unités |
| `geometry.major_every` | number | `2` | Graduation majeure toutes les N unités |
| `geometry.major_length` | number | `78` | Longueur trait majeur |
| `geometry.minor_length` | number | `18` | Longueur trait mineur |
| `geometry.value_font_size` | number | `110` | Taille police valeur |
| `geometry.title_font_size` | number | `34` | Taille police titre |
| `geometry.unit_font_size` | number | `40` | Taille police unité |
| `geometry.tick_font_min` | number | `36` | Taille police graduation (bord) |
| `geometry.tick_font_max` | number | `60` | Taille police graduation (centre) |
| `animation.enabled` | bool | `true` | Animation fluide on/off |
| `animation.stiffness` | number | `0.01` | Force de rappel vers la cible |
| `animation.damping` | number | `0.92` | Amortissement (inertie) |

## Examples

Les exemples ci-dessous sont également disponibles dans [`examples/lovelace-examples.yaml`](examples/lovelace-examples.yaml).

Config minimale :

```yaml
type: custom:jauge-vintage-card
entity: sensor.air_quality_temperature
```

Config entièrement personnalisée :

```yaml
type: custom:jauge-vintage-card
entity: sensor.living_room_temperature
title: SALON
unit: "°C"
min: 0
max: 45
decimals: 1
height: 350
colors:
  background: "#000000"
  needle: ["#990000", "#ff3300", "#ffff66"]
  needle_glow: "#ff3300"
  value: "#ffffff"
  value_glow: "#ffffff"
  title: "#ffd400"
  ticks: "#b4b4b4"
geometry:
  radius: 430
  center_x: -180
  center_y: null
  degrees_per_unit: 4
  major_every: 2
  major_length: 78
  minor_length: 18
  value_font_size: 110
  title_font_size: 34
  unit_font_size: 40
  tick_font_min: 36
  tick_font_max: 60
animation:
  enabled: true
  stiffness: 0.01
  damping: 0.92
```

## License

MIT — see [LICENSE](LICENSE).
