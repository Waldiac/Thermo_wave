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


## Version 3.1

Adds selectable assessment modes for the combined score: Outdoor temperature wave, Balanced, and Solar/Internal gains. This prevents chi1 from being underestimated in rooms with high solar gains or high internal loads.


## Version 3.2

Adds a quick import/export panel near the top of the page so saved project and material data can be loaded immediately without scrolling to the lower data-management section.


## Version 3.3

Adds an integrated bilingual manual with quick start, workflow, indicator explanations, data management and legal/technical notes. The manual can be opened from the header and printed as PDF.


## Version 3.4

Adds a material-builder module for quickly entering a project-specific material list with lambda, density, specific heat, default thickness, optional mu and source notes. The working list can be exported as JSON and imported into the local material database.


## Version 3.5

Streamlines the workflow order: material database first, then wall loading/input, wall build-up, wall calculation, comparison, and finally backup/data exchange. The subtitle was shortened to remove the Excel calibration reference.


## Version 3.6

Fixes English language mode after the workflow restructuring. English translations for the material builder and integrated manual are now included and the cache version was updated.


## Version 3.7

Fixes language switching with explicit DE/EN buttons, URL language override (?lang=en or ?lang=de), and updated cache version.


## Version 3.8

Fixes a JavaScript initialization break caused by event handlers for optional/removed quick-access controls. All event bindings are now guarded, so the DE/EN language switch works reliably.


## Version 3.9

Adds a direct pair comparison: select two constructions from the comparison set and generate a compact indicator-by-indicator assessment table with short overall interpretation and PDF/print option.


## Version 4.0

Reorders the wall workflow: create/load/save wall directly in section 2, layer editing in section 3, calculation in section 4, and a separate decision step to add the current wall to the comparison in section 5. The wall build-up-only print button was removed and the comparison set remains user-built independently from saved walls.


## Version 4.1

Fixes remaining German text fragments in the English direct-comparison table and its short overall assessment. Dynamic labels, column headers, assessments, and storage sentence are now fully localized.


## Version 4.2

Replaces the long material working list with a compact Material Manager. Materials are saved directly to the material database. The manager includes counts, search, category filter, row limit, compact table, and a collapsible input/edit form.


## Version 4.3

Adds a first inhomogeneous-construction mode using area-weighted parallel paths. Users can define paths such as insulated cavity and timber stud with area shares, save/load/delete paths, and calculate approximate area-weighted results. U0, |Y12|, chi1 and chi2 are area-weighted; f and Delay are orientation values from the resulting complex Y12 approach. The method is clearly labelled in the results.


## Version 4.4

Fixes a remaining German placeholder in the English parallel-path mode. The path-name example is now language-dependent: German uses 'z. B. Gefach', English uses 'e.g. insulated cavity'. Cache version updated.


## Version 4.5

Replaces the free-text category field in the material editor with a real category selector. Existing categories are read automatically from the material database, and a 'New category…' option opens a separate input for creating a new category.


## Version 4.6

Moves wall actions into section 3 (wall build-up): save wall, save as new wall, add/update current wall in comparison, and create new wall. Section 5 is reduced to reports, comparison output and complete clean-up. The older wall-save controls in section 2 were removed to simplify the workflow.


## Version 4.7

Adds the 'Create new wall' button back to section 2 so users can start a new wall directly from the load/name/type area. The same action remains available in section 3 after editing the wall build-up.


## Version 4.8

Adds layer check values by parallel path. For inhomogeneous constructions, the results now include separate check-value tables for each saved path, e.g. insulated cavity and timber stud, in addition to the active build-up table.


## Version 4.9

Fixes parallel-path editing: when a saved path is loaded, changes in the visible layer table are now automatically synchronised back to that active path before calculation. This ensures changes such as 200 mm to 160 mm timber/insulation immediately affect the path U-values and weighted results.


## Version 5.0

Changes the inhomogeneous-construction UI from one compact row to two stacked path cards. Path 1 and Path 2 now have separate name, area-share, load/save/delete controls, making the workflow easier for non-expert users.


## Version 5.1

Fixes synchronisation between saved walls and the comparison set. When a wall is saved under the same name/ID, an existing comparison entry is automatically updated, the comparison table is re-rendered, and an already displayed direct comparison is regenerated with the new values.


## Version 5.2

Removes the obsolete 'Save as material' button from the layer editor. Material creation and editing are now handled centrally in section 1 via the Material Manager.


## Version 5.3

Restores saved parallel paths automatically when an inhomogeneous wall is loaded. Path 1 and Path 2 cards are filled from the saved construction, the active path is selected, and the visible layer editor is populated from the active path.


## Version 5.4

Changes the new-wall workflow: 'Create new wall' no longer assigns an automatic comparison-style name such as Construction E. New walls start with an empty name field. A new 'Apply name' button stores the entered name in the current wall state; saving and comparison also read the current name field immediately.
