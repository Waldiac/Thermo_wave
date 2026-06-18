# ThermoWave – Summer Thermal Behaviour Tool (EN ISO 13786)

Static browser tool for calculating dynamic thermal parameters of layered constructions. The implementation follows the matrix logic of the supplied calibrated Excel workbook:

- thermal transmittance `U0`
- internal and external thermal admittance `|Y11|`, `|Y22|`
- periodic thermal transmittance `|Y12|`
- decrement factor `f` and amplitude damping `1/f`
- internal/external areal heat capacity `χ1`, `χ2`

## Files

- `index.html` – user interface
- `styles.css` – page styling
- `app.js` – calculation logic and local data handling
- `materials.json` – editable material database
- `test-calibration.js` – Node-based check against the Excel reference examples

## Important calculation notes

Layers must be entered from inside to outside. The default period is 24 h = 86,400 s. The tool performs a one-dimensional calculation for homogeneous layers. Inhomogeneous layers, timber fractions, strong thermal bridges and project-specific assumptions require separate assessment.

## Local use

Open `index.html` in a browser. For full database loading with `fetch`, using a local web server is more robust:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages deployment

1. Create a new GitHub repository, for example `summer-thermal-tool`.
2. Upload all files from this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save. GitHub will provide a public Pages URL after deployment.

## Legal note

This tool is a non-binding technical aid. It is not a substitute for the official standard, project-specific verification or professional engineering judgement. Users are responsible for all input data and interpretation of results.


## Version 2.5 workflow update

- Saved constructions can now be loaded at the top of the page.
- Constructions can be saved locally, added to a separate comparison set, cleared, and rebuilt or reloaded.
- The comparison set is limited to 10 constructions.
- The report includes a more intuitive interpretation using a 36 °C / 12 K outdoor temperature-wave example and a room-side heat storage example.
- Cache busting uses `app.js?v=5` and `styles.css?v=5`.


Version 2.5 adds a signed EN phase shift and a separate practical delay value. Negative EN shift values are phase-convention results, not physical negative delays.


## Version 2.5

Adds a bilingual German/English user interface with a language selector. The calculation logic remains unchanged. Decimal point is used for display; decimal comma is still accepted in inputs.


## Version 2.7

Adds a dedicated print mode for the actual layer build-up. The layer editor and section heading are hidden, and only the layer table with a small construction title is printed.


## Version 3.0

Adds an integrated explanation of |Y12| as periodic thermal transmittance and makes the combined dynamic indicator transparent: f 40%, |Y12| 35%, Delay 20%, chi1 5%.
