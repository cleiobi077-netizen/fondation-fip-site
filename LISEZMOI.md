# Site — Fondation pour les Initiatives Populaires (FIP)

Site statique (HTML, CSS, JS), sans compilation. Ouvrir `index.html`, ou lancer un serveur local :

```
python -m http.server 5180
```

## À compléter

| Élément | Où | Comment |
|---|---|---|
| **Vidéo du Directeur** | `assets/video-directeur.mp4` | Déposer le fichier MP4. Option : une image d'aperçu `assets/video-poster.jpg` (changer `poster=` dans `index.html`) et des sous-titres `assets/video-directeur.vtt`. Pour YouTube ou Facebook, remplacer la balise `<video>` par l'`<iframe>` indiquée en commentaire. |
| **Logo officiel** | `assets/logo-officiel.jpg` | Récupéré depuis la page Facebook (599 px). Une version vectorielle (SVG) serait plus nette si la FIP en a une. |
| **Photos** | `assets/galerie/` | 2 photos d'équipe et la bannière, récupérées sur Facebook. Les photos plus anciennes de la page ne sont accessibles qu'en miniature sans compte : en ajouter de nouvelles au même format `<figure class="g">`. |
| **Chapitres vidéo** | section `#video` | Ajuster `data-time` (en secondes) et les titres selon la vidéo réelle. |

## Sources des contenus
- Page Facebook officielle : contacts, slogan « Pour une économie plus gabonaise », hommage d'août 2025.
- Affiche Facebook : Concours National des Initiatives Populaires, appli Rise Up Gabon, Instagram @fondation.initiative.gabon, site fip-gabon.org.
- Article Direct Infos Gabon (25/07/2022, source L'Union) : lancement du 18/07/2022, mission, citations.

La carte « pipeline » du haut de page et le quiz montrent un parcours **illustratif**. Ils ne décrivent pas un dossier réel.
