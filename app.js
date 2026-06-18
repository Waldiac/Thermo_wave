'use strict';

const MAX_LAYERS = 18;
const TOOL_VERSION = '3.0';

let currentLang = localStorage.getItem('stw_lang') || 'de';
const I18N = {
  de: {
    mainTitle:'Sommerliches Verhalten von Konstruktionen', subtitle:'Dynamische thermische Kennwerte nach EN ISO 13786, berechnet mit dem kalibrierten Matrixverfahren der Excel-Datei.', language:'Sprache', printPdf:'Drucken / PDF', printLayerBuildUp:'Nur Wandaufbau drucken / PDF', printBuildUpTitle:'Wandaufbau', printBuildUpHint:'Schichtenfolge von innen nach außen.',
    s1Title:'1. Konstruktion laden, benennen und definieren', workflow:'<strong>Ablauf:</strong> Gespeicherte Konstruktion laden oder neu aufbauen → Schichten ergänzen → berechnen → Konstruktion speichern → zum Vergleich hinzufügen → Eingabe leeren → bis zu 10 Konstruktionen vergleichen.',
    loadSavedConstruction:'Gespeicherte Konstruktion laden', loadSelectedConstruction:'Ausgewählte Konstruktion laden', deleteSelectedConstruction:'Ausgewählte Konstruktion löschen', constructionName:'Name der Konstruktion', constructionPlaceholder:'z. B. Konstruktion A', period:'Periode T [s]', rsi:'Rsi innen [m²K/W]', rse:'Rse außen [m²K/W]', loadWallExample:'Wandbeispiel laden', loadD1:'Kalibrierung D.1 laden', loadD2:'Kalibrierung D.2 laden', clearInputNew:'Eingabe für neue Konstruktion leeren',
    s2Title:'2. Schichten von innen nach außen hinzufügen', materialFromDb:'Material aus Datenbank', useSelectedMaterial:'Ausgewähltes Material übernehmen', layerName:'Schichtname', layerPlaceholder:'z. B. Innenputz', addLayer:'Schicht zur Konstruktion hinzufügen', updateLayer:'Ausgewählte Schicht aktualisieren', cancelEditing:'Bearbeitung abbrechen', saveAsMaterial:'Als Material speichern', clearLayersOnly:'Nur Schichten löschen', decimalHint:'Die Anzeige verwendet den Dezimalpunkt. Bei der Eingabe wird auch das Dezimalkomma akzeptiert.', no:'Nr.', layer:'Schicht', action:'Aktion',
    s3Title:'3. Ergebnisse der aktuellen Konstruktion', layerCheckValues:'Prüfwerte der Schichten',
    s4Title:'4. Konstruktion speichern und Vergleich aufbauen', saveConstruction:'Konstruktion speichern', addUpdateComparison:'Zum Vergleich hinzufügen/aktualisieren', reportButton:'Bericht: vergleichende Bewertung', clearComparisonOnly:'Nur Vergleich löschen', comparisonHint:'Der Vergleich akzeptiert bis zu 10 Konstruktionen. Gespeicherte Konstruktionen bleiben in der Browser-Bibliothek und können oben wieder geladen werden.', construction:'Konstruktion', date:'Datum', enShift:'EN shift h', delayH:'Verzögerung h', plainAssessment:'Einfache Bewertung',
    s5Title:'5. Datenbank und Datenaustausch', exportProject:'Projekt-JSON exportieren', importProject:'Projekt-JSON importieren', exportMaterials:'Material-JSON exportieren', importMaterials:'Material-JSON importieren', localDataHint:'Alle Daten werden lokal im Browser gespeichert. Es werden keine Daten an EAACA oder einen Server übertragen.',
    legalTitle:'Haftungsausschluss und rechtlicher Hinweis', legalP1:'Dieses Tool ist eine unverbindliche Berechnungshilfe für die vorläufige technische Bewertung. Es ersetzt keine projektbezogene Planung, fachliche Prüfung, nationale Nachweise oder die rechtlich maßgebenden Texte von Normen, Zulassungen, EPDs oder Produktdeklarationen.', legalP2:'Alle Ergebnisse hängen von den eingegebenen Materialdaten, der Schichtreihenfolge, den Randbedingungen und der gewählten Periode ab. EAACA, ihre Mitglieder, Mitwirkenden und Anbieter dieses Tools übernehmen keine Haftung für Richtigkeit, Vollständigkeit, Eignung für einen bestimmten Zweck oder Folgen der Nutzung. Die Nutzung erfolgt in eigener Verantwortung.', legalP3:'Die Berechnung folgt dem Matrixansatz der bereitgestellten kalibrierten Excel-Datei für EN ISO 13786. Die Norm selbst wird nicht wiedergegeben. Für normative Anforderungen ist die offizielle Norm heranzuziehen.', footerText:'Statische GitHub-Pages-Version · Daten bleiben auf dem PC/im Browser des Nutzers.',
    selectMaterial:'Material aus Datenbank wählen…', noSaved:'Noch keine gespeicherten Konstruktionen', selectSaved:'Gespeicherte Konstruktion wählen…', noLayers:'Noch keine Schichten vorhanden. Beginnen Sie mit der inneren Schicht.', edit:'Bearbeiten', remove:'Entfernen', load:'Laden', moveUp:'Nach oben', moveDown:'Nach unten',
    materialSaved:'Material wurde lokal in der Browser-Datenbank gespeichert. Exportieren Sie die Material-JSON, wenn Sie die aktualisierte Datenbank weiterverwenden oder veröffentlichen möchten.', layerInvalid:'Bitte Schichtname und positive Werte für λ, ρ, c und d eingeben.', maxLayers:'Maximal {n} Schichten.', saveConstructionFirst:'Bitte mindestens eine gültige Schicht hinzufügen, bevor die Konstruktion gespeichert wird.', constructionSaved:'Konstruktion "{name}" wurde lokal gespeichert.', deleteConfirm:'Gespeicherte Konstruktion "{name}" aus der lokalen Bibliothek löschen?', addConstructionFirst:'Bitte mindestens eine gültige Schicht hinzufügen, bevor die Konstruktion zum Vergleich hinzugefügt wird.', comparisonLimit:'Der Vergleich ist auf 10 Konstruktionen begrenzt. Bitte zuerst eine Vergleichskonstruktion entfernen.',
    indoors:'innen', outdoors:'außen', indoorAdm:'|Y₁₁| innere thermische Admittanz', outdoorAdm:'|Y₂₂| äußere thermische Admittanz', periodicTrans:'|Y₁₂| periodischer Wärmedurchgangskoeffizient', decrement:'Dekrementfaktor f', damping:'Amplitudendämpfung 1/f', chi1:'χ₁ raumseitig wirksame Wärmespeicherfähigkeit', chi2:'χ₂ außenseitig wirksame Wärmespeicherfähigkeit', totalThickness:'Gesamtdicke', sumHeat:'Summe d·ρ·c', validLayers:'Gültige Schichten', calcMethod:'Berechnungsmethode', matrixMethod:'Matrixverfahren nach EN ISO 13786, Standardperiode 24 h', phase:'Phase', practicalDelay:'praktische Verzögerung',
    plainReading:'Anschauliche Einordnung:', plainP1:'Wenn die Außentemperaturwelle eine Amplitude von <strong>12 K</strong> hat – zum Beispiel Tagesmittel 24 °C und Nachmittagsspitze 36 °C –, läge die stationäre Wärmestromamplitude bei etwa <strong>{qs} W/m²</strong>. Mit der dynamischen Berechnung nach EN ISO 13786 erreicht die periodische Komponente raumseitig nur etwa <strong>{dyn} W/m²</strong>.', plainP2:'Der Dekrementfaktor <strong>f = {f}</strong> bedeutet: Nur etwa <strong>{rem}%</strong> der rechnerisch stationären Temperaturwellenwirkung bleibt übrig; rund <strong>{red}%</strong> werden durch den Aufbau gedämpft. Der vorzeichenbehaftete EN shift beträgt <strong>{shift} h</strong>. Für die praktische Lesart ist die positive Verzögerung entscheidend: Der Wärmestromscheitel erscheint ungefähr <strong>{delay} h</strong> nach dem Referenzmaximum der Außenbelastung.', plainP3:'Die raumseitig wirksame Wärmespeicherfähigkeit <strong>χ₁ = {chi} kJ/(m²K)</strong> beschreibt den kurzfristigen Puffer der inneren Oberfläche. Eine Innenfläche von 10 m² kann bei 2 K Temperaturhub näherungsweise <strong>{store} kWh</strong> dynamisch aufnehmen.',
    bestDamping:'beste Dämpfung', largestDelay:'größte praktische Verzögerung', highestInternal:'höchste raumseitige Kurzzeitspeicherung', goodDamping:'gute Dämpfung', moderateDamping:'mittlere Dämpfung', weakDamping:'schwache Dämpfung', addTwo:'Für einen echten Vergleich mindestens zwei Konstruktionen hinzufügen. Der Bericht übersetzt dann f, 1/f, shift und χ₁ in eine verständliche Bewertung.', noComparison:'Noch keine Konstruktionen im Vergleich. Speichern oder laden Sie eine Konstruktion und klicken Sie auf „Zum Vergleich hinzufügen/aktualisieren“.',
    quickComparison:'Schnellvergleich:', bestSummerDamping:'Beste sommerliche Dämpfung:', strongestReduction:'Stärkste Amplitudenreduktion:', latestArrival:'Späteste praktische Ankunft der Wärmewelle:', bestBuffer:'Bester raumseitiger Puffer:', lowFExplain:'hat den niedrigsten Dekrementfaktor f. Je kleiner f ist, desto weniger der äußeren Temperaturwelle kommt raumseitig an.', highDampExplain:'hat das höchste 1/f. Das ist die intuitive Lesart der Dämpfung: größer bedeutet stärker gedämpft.', delayExplain:'hat die größte praktische Verzögerung. Das kann eine Nachmittagsspitze in den Abend oder die Nacht verschieben. Der vorzeichenbehaftete EN shift bleibt als Phasenkonvention in der Tabelle.', bufferExplain:'hat das höchste χ₁. Die innere Oberfläche kann kurzfristig mehr Wärme aufnehmen, bevor die Raumtemperatur steigt.',
    reportNone:'<strong>Bericht:</strong> Keine Vergleichskonstruktionen vorhanden.', reportNeedTwo:'<strong>Bericht:</strong> Bitte mindestens zwei Konstruktionen in den Vergleich übernehmen.', reportTitle:'Vergleichender Bericht nach EN ISO 13786', graphicSectionTitle:'Vergleichsgrafik – wichtigste Kennwerte', graphicSectionHint:'Die Grafik fasst die wichtigsten Kennwerte der aktuell im Vergleich befindlichen Konstruktionen zusammen.', printGraphic:'Vergleichsgrafik drucken / PDF', graphicScoreTitle:'Bester kombinierter Dynamikwert', graphicScoreNote:'Score: f 40 %, |Y₁₂| 35 %, Delay 20 %, χ₁ 5 %. Kleiner f und |Y₁₂| sind günstig; große Verzögerung ist günstig. χ₁ wird nur ergänzend berücksichtigt.', y12Simple:'|Y₁₂| ist der periodische Wärmedurchgangskoeffizient – anschaulich ein dynamischer U-Wert für die tägliche Temperaturwelle. Beispiel: |Y₁₂| · 12 K ergibt die dynamische Wärmestromamplitude in W/m².', graphicNoData:'Noch keine Vergleichskonstruktionen vorhanden.', graphicDelay:'Praktische Phasenverschiebung', graphicDamping:'Amplitudendämpfung 1/f', graphicF:'Dekrementfaktor f', graphicChi1:'Raumseitige Wärmespeicherfähigkeit χ₁', graphicChi2:'Außenseitige Wärmespeicherfähigkeit χ₂', graphicHigherBetter:'größer ist günstiger', graphicLowerBetter:'kleiner ist günstiger', graphicMoreInside:'höher = mehr kurzfristige Speicherwirkung innen', graphicMoreOutside:'höher = mehr Speicherwirkung außen', graphicConstructions:'Konstruktionen', graphicSummary:'Kurze Einordnung', graphicBestOverall:'Bester sommerlicher Gesamteindruck', graphicHighestInternal:'Höchste raumseitige Speicherkapazität', graphicWeakestDamping:'Schwächste Dämpfung', graphicLargestDelay:'Größte praktische Verzögerung', plainExampleTitle:'Anschauliches Beispiel: Außenspitze 36 °C', reportIntro:'Interpretationsannahme: Tagesmittel der Außentemperatur 24 °C und Nachmittagsspitze 36 °C. Das entspricht einer Außentemperaturamplitude von 12 K. Die folgende Tabelle schätzt, was diese periodische Wärmewelle für jede Konstruktion bedeutet.', signNote:'Hinweis zum Vorzeichen der Phasenverschiebung: EN ISO 13786 verwendet eine Phasenwinkel-Konvention. Deshalb kann der vorzeichenbehaftete Wert negativ sein. Für die Alltagsinterpretation wird zusätzlich die positive praktische Verzögerung angegeben.', techComparison:'Technischer Vergleich', overall:'Gesamttendenz Sommer', howToRead:'So lesen:', bestCombined:'Beste kombinierte Tendenz:', rankingExplain:'Diese Einordnung bewertet primär die Abwehr der äußeren täglichen Temperaturwelle: niedriger f-Wert, niedriges |Y₁₂| und große praktische Verzögerung. χ₁ fließt nur ergänzend als raumseitiger Puffer ein. Es ist eine praktische Lesehilfe, keine Bewertungsklasse nach EN ISO 13786.', howReadText:'Eine Wand mit niedrigem f und niedrigem |Y₁₂| hält die äußere Wärmewelle raumseitig klein. Ein hohes χ₁ hilft, kurzzeitige innere oder solare Lasten an der inneren Oberfläche zu puffern. Eine große praktische Verzögerung ist besonders hilfreich, wenn die verzögerte Wärme abends oder nachts weggelüftet werden kann.',
    dynamicHeat:'Dynamische Wärmestromamplitude bei 12 K', remainingEffect:'Verbleibende Wärmewellenwirkung f', peakShift:'Scheitelverschiebung', roomBuffer:'Raumseitiger Puffer: 10 m², 2 K', lowestF:'niedrigsten Dekrementfaktor f', lowestFExpl:'Das ist meist der direkteste Hinweis auf sommerliche Dämpfung: weniger der äußeren Temperaturwelle bleibt übrig.', highest1f:'höchste Amplitudendämpfung 1/f', highest1fExpl:'Das sagt dasselbe anschaulicher: höher bedeutet stärkere Dämpfung.', lowestY12:'niedrigsten periodischen Wärmedurchgang |Y₁₂|', lowestY12Expl:'Bei gleicher Außentemperaturamplitude überträgt diese Konstruktion die kleinste periodische Wärmestromamplitude zur Raumseite.', largestPracticalDelay:'größte praktische Verzögerung', largestPracticalDelayExpl:'Der Wärmestromscheitel kommt alltagsnah am spätesten an. Das ist günstig, wenn Nachtlüftung die verzögerte Wärme abführen kann.', highestChi1:'höchste raumseitig wirksame Wärmespeicherfähigkeit χ₁', highestChi1Expl:'Die Innenseite hat den stärksten kurzfristigen Puffer gegen Raumtemperaturschwankungen.', lowestU0:'niedrigsten stationären U₀-Wert', lowestU0Expl:'Das ist gut für den normalen Wärmedurchgang, reicht allein aber nicht zur Beurteilung des sommerlichen dynamischen Verhaltens.',
    hasThe:'hat den', constructionWord:'Konstruktion'
  },
  en: {
    mainTitle:'Summer Thermal Behaviour of Constructions', subtitle:'Dynamic thermal parameters according to EN ISO 13786, based on the calibrated Excel matrix method.', language:'Language', printPdf:'Print / PDF', printLayerBuildUp:'Print build-up only / PDF', printBuildUpTitle:'Wall build-up', printBuildUpHint:'Layer sequence from inside to outside.',
    s1Title:'1. Load, name and define construction', workflow:'<strong>Workflow:</strong> Load a saved construction or build a new one → add layers → calculate → save construction → add it to comparison → clear input → compare up to 10 constructions.', loadSavedConstruction:'Load saved construction', loadSelectedConstruction:'Load selected construction', deleteSelectedConstruction:'Delete selected saved construction', constructionName:'Construction name', constructionPlaceholder:'e.g. Construction A', period:'Period T [s]', rsi:'Rsi inside [m²K/W]', rse:'Rse outside [m²K/W]', loadWallExample:'Load wall example', loadD1:'Load calibration D.1', loadD2:'Load calibration D.2', clearInputNew:'Clear input for new construction',
    s2Title:'2. Add layers from inside to outside', materialFromDb:'Material from database', useSelectedMaterial:'Use selected material', layerName:'Layer name', layerPlaceholder:'e.g. Interior plaster', addLayer:'Add layer to construction', updateLayer:'Update selected layer', cancelEditing:'Cancel editing', saveAsMaterial:'Save as material', clearLayersOnly:'Clear layers only', decimalHint:'Decimal point is used for display and export; decimal comma is still accepted when typing.', no:'No.', layer:'Layer', action:'Action',
    s3Title:'3. Results for current construction', layerCheckValues:'Layer check values',
    s4Title:'4. Save construction and build comparison set', saveConstruction:'Save construction', addUpdateComparison:'Add/update in comparison', reportButton:'Report: comparative assessment', clearComparisonOnly:'Clear comparison only', comparisonHint:'The comparison accepts up to 10 constructions. Saved constructions remain in the browser library and can be loaded again at the top.', construction:'Construction', date:'Date', enShift:'EN shift h', delayH:'Delay h', plainAssessment:'Plain assessment',
    s5Title:'5. Database and data exchange', exportProject:'Export project JSON', importProject:'Import project JSON', exportMaterials:'Export materials JSON', importMaterials:'Import materials JSON', localDataHint:'All data are stored locally in the browser. No data are transmitted to EAACA or any server.',
    legalTitle:'Disclaimer and legal notice', legalP1:'This tool is a non-binding calculation aid for preliminary technical assessment. It does not replace project-specific design, professional judgement, verification under the applicable national rules, or the legally relevant text of standards, approvals, EPDs or product declarations.', legalP2:'All results depend on user-entered material data, layer order, boundary conditions and the selected period. EAACA, its members, contributors and providers of this tool accept no liability for the accuracy, completeness, fitness for a particular purpose or consequences of using the tool. Use is at the user’s own responsibility.', legalP3:'The calculation follows the matrix approach implemented in the provided calibrated Excel file for EN ISO 13786. The standard itself is not reproduced. Users must consult the official standard for normative requirements.', footerText:'Static GitHub Pages version · Data remain on the user\'s PC/browser.',
    selectMaterial:'Select material from database…', noSaved:'No saved constructions yet', selectSaved:'Select saved construction…', noLayers:'No layers added yet. Start with the inner layer.', edit:'Edit', remove:'Remove', load:'Load', moveUp:'Move up', moveDown:'Move down', materialSaved:'Material saved locally in the browser database. Export materials JSON if you want to reuse or publish the updated database.', layerInvalid:'Please enter a layer name and positive values for λ, ρ, c and d.', maxLayers:'Maximum {n} layers.', saveConstructionFirst:'Please add at least one valid layer before saving the construction.', constructionSaved:'Construction "{name}" saved locally.', deleteConfirm:'Delete saved construction "{name}" from the local library?', addConstructionFirst:'Please add at least one valid layer before adding the construction to the comparison.', comparisonLimit:'The comparison is limited to 10 constructions. Delete one comparison item before adding another.',
    indoors:'indoor', outdoors:'outdoor', indoorAdm:'|Y₁₁| indoor admittance', outdoorAdm:'|Y₂₂| outdoor admittance', periodicTrans:'|Y₁₂| periodic transmittance', decrement:'Decrement factor f', damping:'Amplitude damping 1/f', chi1:'χ₁ internal areal heat capacity', chi2:'χ₂ external areal heat capacity', totalThickness:'Total thickness', sumHeat:'Sum d·ρ·c', validLayers:'Valid layers', calcMethod:'Calculation method', matrixMethod:'Matrix method according to EN ISO 13786, 24 h default period', phase:'phase', practicalDelay:'practical delay', plainReading:'Plain-language reading:', plainP1:'If the outdoor temperature wave has an amplitude of <strong>12 K</strong> — for example daily mean 24 °C and afternoon peak 36 °C — the steady-state heat-flow amplitude would be about <strong>{qs} W/m²</strong>. With the dynamic EN ISO 13786 calculation, the periodic part reaching the room side is about <strong>{dyn} W/m²</strong>.', plainP2:'The decrement factor <strong>f = {f}</strong> means: only about <strong>{rem}%</strong> of the quasi-steady temperature-wave effect remains; roughly <strong>{red}%</strong> is damped by the construction. The signed EN shift is <strong>{shift} h</strong>. For practical reading, use the positive delay: the heat-flow peak appears roughly <strong>{delay} h</strong> after the outdoor reference peak.', plainP3:'The internal areal heat capacity <strong>χ₁ = {chi} kJ/(m²K)</strong> can be read as the room-side thermal buffer. A 10 m² inner surface with a 2 K temperature swing can dynamically take up roughly <strong>{store} kWh</strong> in this simplified interpretation.',
    bestDamping:'best damping', largestDelay:'largest practical delay', highestInternal:'highest room-side short-term storage', goodDamping:'good damping', moderateDamping:'moderate damping', weakDamping:'weak damping', addTwo:'Add at least two constructions for a real comparison. The report then translates f, 1/f, shift and χ₁ into plain language.', noComparison:'No constructions in the comparison yet. Save or load a construction and click “Add/update in comparison”.', quickComparison:'Quick comparison:', bestSummerDamping:'Best summer damping:', strongestReduction:'Strongest amplitude reduction:', latestArrival:'Latest practical heat-wave arrival:', bestBuffer:'Best room-side buffer:', lowFExplain:'has the lowest decrement factor f. Lower f means less of the outdoor heat wave reaches the room side.', highDampExplain:'has the highest 1/f. This is the intuitive damping multiplier: higher means stronger damping.', delayExplain:'has the largest practical delay. This can move the peak from afternoon into evening/night. The signed EN shift is kept in the table as a phase convention.', bufferExplain:'has the highest χ₁. The inner surface can absorb more short-term heat before the room temperature rises.',
    reportNone:'<strong>Report:</strong> No comparison constructions available.', reportNeedTwo:'<strong>Report:</strong> Add at least two constructions to generate a comparative assessment.', reportTitle:'Comparative report according to EN ISO 13786', graphicSectionTitle:'Comparison graphic – key indicators', graphicSectionHint:'The graphic summarises the key indicators of the constructions currently included in the comparison.', printGraphic:'Print comparison graphic / PDF', graphicScoreTitle:'Best combined dynamic indicator', graphicScoreNote:'Score: f 40%, |Y₁₂| 35%, Delay 20%, χ₁ 5%. Lower f and |Y₁₂| are favourable; higher delay is favourable. χ₁ is included only as a secondary buffer indicator.', y12Simple:'|Y₁₂| is the periodic thermal transmittance – in plain words a dynamic U-value for the daily temperature wave. Example: |Y₁₂| · 12 K gives the dynamic heat-flow amplitude in W/m².', graphicNoData:'No constructions in the comparison yet.', graphicDelay:'Practical delay', graphicDamping:'Amplitude damping 1/f', graphicF:'Decrement factor f', graphicChi1:'Room-side heat capacity χ₁', graphicChi2:'Outer-side heat capacity χ₂', graphicHigherBetter:'higher is better', graphicLowerBetter:'lower is better', graphicMoreInside:'higher = more short-term storage effect on the room side', graphicMoreOutside:'higher = more storage effect on the outside', graphicConstructions:'Constructions', graphicSummary:'Short assessment', graphicBestOverall:'Best overall summer impression', graphicHighestInternal:'Highest room-side storage capacity', graphicWeakestDamping:'Weakest damping', graphicLargestDelay:'Largest practical delay', plainExampleTitle:'Plain-language example: outdoor peak 36 °C', reportIntro:'Assumption for interpretation only: daily mean outdoor temperature 24 °C and afternoon peak 36 °C. This corresponds to an outdoor temperature amplitude of 12 K. The table below estimates what this periodic heat wave means for each construction.', signNote:'Note on the sign of the time shift: EN ISO 13786 uses a phase-angle convention. Therefore the signed value can be negative. For everyday interpretation, the table also gives the positive practical delay.', techComparison:'Technical comparison', overall:'Overall summer tendency', howToRead:'How to read this:', bestCombined:'Best combined tendency:', rankingExplain:'This ranking primarily assesses protection against the external daily temperature wave: low f, low |Y₁₂| and large practical delay. χ₁ is included only as a secondary room-side buffer indicator. It is a practical reading aid, not an EN ISO 13786 rating class.', howReadText:'A wall with low f and low |Y₁₂| keeps the outdoor heat wave small on the room side. A high χ₁ helps absorb short internal or solar gains at the inner surface. A useful practical delay is most valuable when the delayed heat can be removed by evening or night ventilation.',
    dynamicHeat:'Dynamic heat-flow amplitude at 12 K', remainingEffect:'Remaining heat-wave effect f', peakShift:'Peak shift', roomBuffer:'Room-side buffer: 10 m², 2 K', lowestF:'lowest decrement factor f', lowestFExpl:'This is usually the most direct indicator for summer damping: less of the outdoor temperature wave remains.', highest1f:'highest amplitude damping 1/f', highest1fExpl:'This says the same thing in a more intuitive way: higher means stronger damping.', lowestY12:'lowest periodic thermal transmittance |Y₁₂|', lowestY12Expl:'At the same outdoor amplitude, this construction transmits the lowest periodic heat-flow amplitude to the room side.', largestPracticalDelay:'largest practical delay', largestPracticalDelayExpl:'The heat-flow peak arrives latest in plain-language terms. This is useful when night ventilation can remove the delayed heat.', highestChi1:'highest internal areal heat capacity χ₁', highestChi1Expl:'The inner side has the strongest short-term buffer against room temperature swings.', lowestU0:'lowest steady-state U₀ value', lowestU0Expl:'Good for ordinary heat transfer, but not sufficient alone to judge summer dynamic behaviour.', hasThe:'has the', constructionWord:'Construction'
  }
};
function t(key, vars = {}) {
  let s = (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, v); });
  return s;
}
function translateStatic() {
  document.documentElement.lang = currentLang;
  const sel = document.getElementById('languageSelect');
  if (sel) sel.value = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-placeholder-key]').forEach(el => { el.placeholder = t(el.dataset.placeholderKey); });
  const v = document.getElementById('versionLabel'); if (v) v.textContent = TOOL_VERSION;
  const fv = document.getElementById('footerVersion'); if (fv) fv.textContent = TOOL_VERSION;
  updatePrintConstructionName();
}
function updatePrintConstructionName() {
  const el = document.getElementById('printConstructionName');
  if (el) el.textContent = state.projectName || document.getElementById('projectName')?.value || '–';
}
function printLayerBuildUpOnly() {
  updatePrintConstructionName();
  document.body.classList.add('print-build-up-only');
  const cleanup = () => {
    document.body.classList.remove('print-build-up-only');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 30);
}
function printComparisonGraphicOnly() {
  renderComparisonGraphic();
  document.body.classList.add('print-graphic-only');
  const cleanup = () => {
    document.body.classList.remove('print-graphic-only');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 30);
}
function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'de';
  localStorage.setItem('stw_lang', currentLang);
  translateStatic();
  renderMaterialSelect();
  renderSavedConstructionSelect();
  loadStateToInputs();
  renderComparison();
}
function currentLocale() { return currentLang === 'de' ? 'de-DE' : 'en-US'; }
function materialName(m) { return currentLang === 'de' ? (m.name_de || m.name_en || '') : (m.name_en || m.name_de || ''); }

const DEFAULT_STATE = {
  periodSeconds: 86400,
  rsi: 0.13,
  rse: 0.04,
  projectName: 'Construction A',
  layers: [
    { name: 'Interior plaster', lambda: 0.70, density: 1400, specificHeat: 1000, thickness: 0.010 },
    { name: 'Autoclaved aerated concrete 500', lambda: 0.10, density: 500, specificHeat: 1000, thickness: 0.175 },
    { name: 'Mineral insulation board', lambda: 0.045, density: 100, specificHeat: 1000, thickness: 0.120 },
    { name: 'External render', lambda: 0.21, density: 800, specificHeat: 1000, thickness: 0.020 }
  ]
};

let materialDb = [];
let state = structuredClone(DEFAULT_STATE);
let editLayerIndex = null;

const $ = (id) => document.getElementById(id);
const num = (v) => {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(String(v).trim().replace(',', '.'));
};
const fmt = (v, d = 3) => Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d, useGrouping: false }) : '–';
const fmtFlex = (v, d = 4) => Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d, useGrouping: false }) : '–';
const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

function complex(re = 0, im = 0) { return { re, im }; }
function cAdd(a, b) { return complex(a.re + b.re, a.im + b.im); }
function cSub(a, b) { return complex(a.re - b.re, a.im - b.im); }
function cMul(a, b) { return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
function cDiv(a, b) {
  const den = b.re * b.re + b.im * b.im;
  return den === 0 ? complex(NaN, NaN) : complex((a.re * b.re + a.im * b.im) / den, (a.im * b.re - a.re * b.im) / den);
}
function cNeg(a) { return complex(-a.re, -a.im); }
function cAbs(a) { return Math.hypot(a.re, a.im); }
function cPhaseHours(a, periodHours) {
  if (!Number.isFinite(a.re) || !Number.isFinite(a.im) || (a.re === 0 && a.im === 0)) return { positive: 0, dynamic: -periodHours / 2 };
  let angle = Math.atan2(a.im, a.re);
  if (angle < 0) angle += 2 * Math.PI;
  const positive = angle / (2 * Math.PI) * periodHours;
  const dynamic = positive - periodHours / 2;
  return { positive, dynamic, delay: Math.abs(dynamic) };
}
function mMul(A, B) {
  return [
    [cAdd(cMul(A[0][0], B[0][0]), cMul(A[0][1], B[1][0])), cAdd(cMul(A[0][0], B[0][1]), cMul(A[0][1], B[1][1]))],
    [cAdd(cMul(A[1][0], B[0][0]), cMul(A[1][1], B[1][0])), cAdd(cMul(A[1][0], B[0][1]), cMul(A[1][1], B[1][1]))]
  ];
}
function identity() { return [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(1, 0)]]; }

function validLayer(l) {
  return l && l.name && l.lambda > 0 && l.density > 0 && l.specificHeat > 0 && l.thickness > 0;
}

function layerMatrix(layer, periodSeconds) {
  const lambda = layer.lambda;
  const rho = layer.density;
  const c = layer.specificHeat;
  const d = layer.thickness;
  const delta = Math.sqrt(lambda * periodSeconds / (Math.PI * rho * c));
  const xi = d / delta;
  const sh = Math.sinh(xi), ch = Math.cosh(xi), si = Math.sin(xi), co = Math.cos(xi);
  const z11 = complex(ch * co, sh * si);
  const z12 = complex(-(delta / (2 * lambda)) * (sh * co + ch * si), -(delta / (2 * lambda)) * (ch * si - sh * co));
  const z21 = complex(-(lambda / delta) * (sh * co - ch * si), -(lambda / delta) * (sh * co + ch * si));
  const z22 = complex(ch * co, sh * si);
  return { matrix: [[z11, z12], [z21, z22]], delta, xi, R: d / lambda };
}

function calculate(inputState) {
  const periodSeconds = inputState.periodSeconds;
  const periodHours = periodSeconds / 3600;
  const valid = inputState.layers.filter(validLayer);
  let P = identity();
  const layerDetails = [];
  valid.forEach((l) => {
    const info = layerMatrix(l, periodSeconds);
    P = mMul(info.matrix, P);
    layerDetails.push({ ...l, R: info.R, delta: info.delta, xi: info.xi });
  });
  const p11 = P[0][0], p12 = P[0][1], p21 = P[1][0], p22 = P[1][1];
  const Rsi = inputState.rsi, Rse = inputState.rse;
  const Zee11 = cSub(p11, complex(Rse * p21.re, Rse * p21.im));
  const Zee12 = cSub(cSub(p12, complex(Rsi * p11.re, Rsi * p11.im)), complex(Rse * (p22.re - Rsi * p21.re), Rse * (p22.im - Rsi * p21.im)));
  const Zee21 = p21;
  const Zee22 = cSub(p22, complex(Rsi * p21.re, Rsi * p21.im));
  const Y11 = cDiv(cNeg(Zee11), Zee12);
  const Y22 = cDiv(cNeg(Zee22), Zee12);
  const Y12 = cDiv(complex(1, 0), Zee12);
  const chi1 = cAbs(cDiv(cSub(Zee11, complex(1, 0)), Zee12)) * periodSeconds / (2 * Math.PI) / 1000;
  const chi2 = cAbs(cDiv(cSub(Zee22, complex(1, 0)), Zee12)) * periodSeconds / (2 * Math.PI) / 1000;
  const totalR = valid.reduce((s, l) => s + l.thickness / l.lambda, 0);
  const totalThickness = valid.reduce((s, l) => s + l.thickness, 0);
  const totalHeatCapacity = valid.reduce((s, l) => s + l.thickness * l.density * l.specificHeat, 0) / 1000;
  const U0 = valid.length ? 1 / (Rsi + totalR + Rse) : NaN;
  const decrement = Number.isFinite(U0) ? cAbs(Y12) / U0 : NaN;
  return {
    validLayers: valid,
    layerDetails,
    periodHours,
    U0,
    Y11: { value: cAbs(Y11), phase: cPhaseHours(Y11, periodHours) },
    Y22: { value: cAbs(Y22), phase: cPhaseHours(Y22, periodHours) },
    Y12: { value: cAbs(Y12), phase: cPhaseHours(Y12, periodHours) },
    decrement,
    damping: Number.isFinite(decrement) && decrement !== 0 ? 1 / decrement : NaN,
    chi1,
    chi2,
    totalThickness,
    totalHeatCapacity,
    check: decrement < 1 ? 'OK' : 'Check: f ≥ 1',
    matrices: { Zee11, Zee12, Zee21, Zee22, P }
  };
}

function renderMaterialSelect() {
  const select = $('materialSelect');
  select.innerHTML = `<option value="">${t('selectMaterial')}</option>` + materialDb.map((m, i) => `<option value="${i}">${esc(materialName(m))}</option>`).join('');
}

function layerFromEditor() {
  return {
    name: $('layerName').value.trim(),
    lambda: num($('layerLambda').value),
    density: num($('layerDensity').value),
    specificHeat: num($('layerHeat').value),
    thickness: num($('layerThickness').value)
  };
}
function fillLayerEditor(layer = {}) {
  $('layerName').value = layer.name || '';
  $('layerLambda').value = Number.isFinite(layer.lambda) ? fmtFlex(layer.lambda, 4) : '';
  $('layerDensity').value = Number.isFinite(layer.density) ? fmtFlex(layer.density, 1) : '';
  $('layerHeat').value = Number.isFinite(layer.specificHeat) ? fmtFlex(layer.specificHeat, 1) : '';
  $('layerThickness').value = Number.isFinite(layer.thickness) ? fmtFlex(layer.thickness, 4) : '';
}
function clearLayerEditor() {
  editLayerIndex = null;
  fillLayerEditor({});
  $('addLayer').disabled = false;
  $('updateLayer').disabled = true;
  $('cancelLayerEdit').disabled = true;
}

function saveMaterialsLocal() {
  localStorage.setItem('stw_materials', JSON.stringify(materialDb));
}
function loadMaterialsLocal() {
  const local = localStorage.getItem('stw_materials');
  if (!local) return false;
  try {
    const parsed = JSON.parse(local);
    if (Array.isArray(parsed)) { materialDb = parsed; return true; }
  } catch {}
  return false;
}
function saveCurrentEditorAsMaterial() {
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  const id = layer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();
  const material = {
    id,
    name_en: layer.name,
    name_de: layer.name,
    lambda: layer.lambda,
    density: layer.density,
    specificHeat: layer.specificHeat,
    defaultThickness: layer.thickness,
    category: 'User materials'
  };
  const existingIdx = materialDb.findIndex(m => (m.name_en || '').toLowerCase() === layer.name.toLowerCase() || m.id === id);
  if (existingIdx >= 0) materialDb[existingIdx] = { ...materialDb[existingIdx], ...material };
  else materialDb.push(material);
  saveMaterialsLocal();
  renderMaterialSelect();
  alert(t('materialSaved'));
}

function validateEditorLayer(layer) {
  if (!validLayer(layer)) {
    alert(t('layerInvalid'));
    return false;
  }
  return true;
}
function addLayerFromEditor() {
  if (state.layers.length >= MAX_LAYERS) { alert(t('maxLayers', {n: MAX_LAYERS})); return; }
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  state.layers.push(layer);
  clearLayerEditor();
  calculateAndRender();
}
function editLayer(index) {
  const layer = state.layers[index];
  if (!layer) return;
  editLayerIndex = index;
  fillLayerEditor(layer);
  $('addLayer').disabled = true;
  $('updateLayer').disabled = false;
  $('cancelLayerEdit').disabled = false;
  $('layerName').focus();
}
function updateLayerFromEditor() {
  if (editLayerIndex === null) return;
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  state.layers[editLayerIndex] = layer;
  clearLayerEditor();
  calculateAndRender();
}
function useSelectedMaterial() {
  const idx = Number($('materialSelect').value);
  if (!Number.isInteger(idx) || !materialDb[idx]) return;
  const m = materialDb[idx];
  fillLayerEditor({ name: materialName(m), lambda: m.lambda, density: m.density, specificHeat: m.specificHeat, thickness: m.defaultThickness || 0.1 });
}

function renderLayers() {
  const tbody = $('layersBody');
  const valid = state.layers.filter(l => l && (l.name || l.lambda || l.thickness));
  state.layers = valid.slice(0, MAX_LAYERS);
  if (!state.layers.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">${t('noLayers')}</td></tr>`;
    return;
  }
  tbody.innerHTML = state.layers.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(l.name)}</td>
      <td>${fmtFlex(l.lambda, 4)}</td>
      <td>${fmtFlex(l.density, 1)}</td>
      <td>${fmtFlex(l.specificHeat, 1)}</td>
      <td>${fmtFlex(l.thickness, 4)}</td>
      <td class="layer-actions">
        <button class="small icon" data-up="${i}" title="${t('moveUp')}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="small icon" data-down="${i}" title="${t('moveDown')}" ${i === state.layers.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="small" data-edit="${i}">${t('edit')}</button>
        <button class="small danger" data-remove="${i}">${t('remove')}</button>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-up]').forEach(btn => btn.addEventListener('click', () => moveLayer(Number(btn.dataset.up), -1)));
  tbody.querySelectorAll('[data-down]').forEach(btn => btn.addEventListener('click', () => moveLayer(Number(btn.dataset.down), 1)));
  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editLayer(Number(btn.dataset.edit))));
  tbody.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    state.layers.splice(Number(btn.dataset.remove), 1);
    if (editLayerIndex !== null) clearLayerEditor();
    calculateAndRender();
  }));
}

function moveLayer(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= state.layers.length) return;
  const tmp = state.layers[index];
  state.layers[index] = state.layers[target];
  state.layers[target] = tmp;
  if (editLayerIndex !== null) {
    if (editLayerIndex === index) editLayerIndex = target;
    else if (editLayerIndex === target) editLayerIndex = index;
  }
  calculateAndRender();
}

function currentPlainExplanation(res) {
  const outdoorAmplitude = 12;
  const quasiSteady = res.U0 * outdoorAmplitude;
  const dynamicHeatFlow = res.Y12.value * outdoorAmplitude;
  const reductionPct = Number.isFinite(res.decrement) ? (1 - res.decrement) * 100 : NaN;
  const storage10m2_2K = res.chi1 * 10 * 2 / 3600;
  return `
    <strong>${t('plainReading')}</strong>
    <p>${t('plainP1', { qs: fmt(quasiSteady, 1), dyn: fmt(dynamicHeatFlow, 1) })}</p>
    <p>${t('plainP2', { f: fmt(res.decrement, 3), rem: fmt(res.decrement * 100, 0), red: fmt(reductionPct, 0), shift: fmt(res.Y12.phase.dynamic, 1), delay: fmt(res.Y12.phase.delay, 1) })}</p>
    <p>${t('plainP3', { chi: fmt(res.chi1, 1), store: fmt(storage10m2_2K, 2) })}</p>`;
}

function renderResults(res) {
  const cards = $('results');
  cards.innerHTML = `
    <div class="metric"><span>U₀</span><strong>${fmt(res.U0, 4)}</strong><small>W/(m²K)</small></div>
    <div class="metric"><span>${t('indoorAdm')}</span><strong>${fmt(res.Y11.value, 3)}</strong><small>W/(m²K), ${t('phase')} ${fmt(res.Y11.phase.positive, 2)} h</small></div>
    <div class="metric"><span>${t('outdoorAdm')}</span><strong>${fmt(res.Y22.value, 3)}</strong><small>W/(m²K), ${t('phase')} ${fmt(res.Y22.phase.positive, 2)} h</small></div>
    <div class="metric"><span>${t('periodicTrans')}</span><strong>${fmt(res.Y12.value, 4)}</strong><small>W/(m²K), EN shift ${fmt(res.Y12.phase.dynamic, 2)} h · ${t('practicalDelay')} ${fmt(res.Y12.phase.delay, 2)} h</small></div>
    <div class="metric"><span>${t('decrement')}</span><strong>${fmt(res.decrement, 4)}</strong><small>${res.check}</small></div>
    <div class="metric"><span>${t('damping')}</span><strong>${fmt(res.damping, 2)}</strong><small>–</small></div>
    <div class="metric"><span>${t('chi1')}</span><strong>${fmt(res.chi1, 2)}</strong><small>kJ/(m²K)</small></div>
    <div class="metric"><span>${t('chi2')}</span><strong>${fmt(res.chi2, 2)}</strong><small>kJ/(m²K)</small></div>`;
  $('summaryTable').innerHTML = `
    <tr><th>${t('totalThickness')}</th><td>${fmt(res.totalThickness, 3)} m</td></tr>
    <tr><th>${t('sumHeat')}</th><td>${fmt(res.totalHeatCapacity, 1)} kJ/(m²K)</td></tr>
    <tr><th>${t('validLayers')}</th><td>${res.validLayers.length}</td></tr>
    <tr><th>${t('calcMethod')}</th><td>${t('matrixMethod')}</td></tr>`;
  $('plainExplanation').innerHTML = currentPlainExplanation(res);
  $('detailsBody').innerHTML = res.layerDetails.map((l, idx) => `
    <tr><td>${idx + 1}</td><td>${esc(l.name)}</td><td>${fmtFlex(l.R, 4)}</td><td>${fmtFlex(l.delta, 4)}</td><td>${fmtFlex(l.xi, 4)}</td></tr>`).join('');
}

function calculateAndRender(redrawLayers = true) {
  state.projectName = $('projectName')?.value || state.projectName;
  state.periodSeconds = num($('periodSeconds')?.value) || 86400;
  state.rsi = num($('rsi')?.value); if (!Number.isFinite(state.rsi)) state.rsi = 0.13;
  state.rse = num($('rse')?.value); if (!Number.isFinite(state.rse)) state.rse = 0.04;
  if (redrawLayers) renderLayers();
  const res = calculate(state);
  renderResults(res);
  saveLocal();
}

function loadStateToInputs() {
  $('projectName').value = state.projectName || '';
  $('periodSeconds').value = fmtFlex(state.periodSeconds, 0);
  $('rsi').value = fmtFlex(state.rsi, 3);
  $('rse').value = fmtFlex(state.rse, 3);
  clearLayerEditor();
  renderLayers();
  calculateAndRender(false);
}

function clearLayers() {
  state.layers = [];
  clearLayerEditor();
  calculateAndRender();
}

function getSavedLibrary() {
  // Migration: old versions used stw_constructions as both library and comparison.
  const lib = localStorage.getItem('stw_library');
  if (lib) { try { return (JSON.parse(lib) || []).map(ensureDelay); } catch { return []; } }
  const old = localStorage.getItem('stw_constructions');
  if (old) {
    try {
      const parsed = JSON.parse(old);
      if (Array.isArray(parsed)) {
        localStorage.setItem('stw_library', JSON.stringify(parsed));
        return parsed.map(ensureDelay);
      }
    } catch {}
  }
  return [];
}
function setSavedLibrary(list) {
  localStorage.setItem('stw_library', JSON.stringify(list));
  renderSavedConstructionSelect();
}
function ensureDelay(x) {
  if (x && x.results && !Number.isFinite(x.results.delay)) x.results.delay = Math.abs(x.results.shift);
  return x;
}
function getComparisonSet() {
  try { return (JSON.parse(localStorage.getItem('stw_comparison') || '[]') || []).map(ensureDelay); } catch { return []; }
}
function setComparisonSet(list) {
  localStorage.setItem('stw_comparison', JSON.stringify(list));
}
function makeConstructionItem() {
  const res = calculate(state);
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name: state.projectName || 'Unnamed construction',
    state: structuredClone(state),
    results: { U0: res.U0, Y12: res.Y12.value, shift: res.Y12.phase.dynamic, delay: res.Y12.phase.delay, f: res.decrement, damping: res.damping, chi1: res.chi1, chi2: res.chi2, thickness: res.totalThickness, heatCapacity: res.totalHeatCapacity }
  };
}
function renderSavedConstructionSelect() {
  const select = $('savedConstructionSelect');
  if (!select) return;
  const lib = getSavedLibrary();
  if (!lib.length) {
    select.innerHTML = `<option value="">${t('noSaved')}</option>`;
    return;
  }
  select.innerHTML = `<option value="">${t('selectSaved')}</option>` + lib.map((x) => `<option value="${esc(x.id)}">${esc(x.name)} · ${new Date(x.date).toLocaleDateString(currentLocale())}</option>`).join('');
}
function saveCurrentConstructionToLibrary(silent = false) {
  const res = calculate(state);
  if (!res.validLayers.length) { alert(t('saveConstructionFirst')); return null; }
  const lib = getSavedLibrary();
  const name = state.projectName || 'Unnamed construction';
  const existingIdx = lib.findIndex(x => x.name === name);
  const item = makeConstructionItem();
  if (existingIdx >= 0) {
    item.id = lib[existingIdx].id;
    lib[existingIdx] = item;
  } else {
    lib.push(item);
  }
  setSavedLibrary(lib);
  if (!silent) alert(t('constructionSaved', {name}));
  return item;
}
function loadSavedConstructionById(id) {
  const item = getSavedLibrary().find(x => x.id === id);
  if (!item) return;
  state = structuredClone(item.state);
  loadStateToInputs();
}
function deleteSavedConstructionById(id) {
  if (!id) return;
  const lib = getSavedLibrary();
  const item = lib.find(x => x.id === id);
  if (!item) return;
  if (!confirm(t('deleteConfirm', {name: item.name}))) return;
  setSavedLibrary(lib.filter(x => x.id !== id));
}
function addCurrentToComparison() {
  const res = calculate(state);
  if (!res.validLayers.length) { alert(t('addConstructionFirst')); return; }
  const item = saveCurrentConstructionToLibrary(true);
  if (!item) return;
  const comp = getComparisonSet();
  const existingIdx = comp.findIndex(x => x.name === item.name);
  if (existingIdx >= 0) comp[existingIdx] = item;
  else {
    if (comp.length >= 10) { alert(t('comparisonLimit')); return; }
    comp.push(item);
  }
  setComparisonSet(comp);
  renderComparison();
}


function nextConstructionName() {
  const saved = getComparisonSet();
  const letter = String.fromCharCode(65 + Math.min(saved.length, 9));
  return currentLang === 'de' ? `Konstruktion ${letter}` : `Construction ${letter}`;
}
function newConstruction() {
  state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: nextConstructionName(), layers: [] };
  loadStateToInputs();
}

function loadExample(type) {
  if (type === 'd1') {
    state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: 'Calibration D.1 concrete wall', layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] };
  } else if (type === 'd2') {
    state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: 'Calibration D.2 multilayer construction', layers: [
      { name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 },
      { name: 'Thermal insulation layer', lambda: 0.04, density: 30, specificHeat: 1400, thickness: 0.1 },
      { name: 'Render', lambda: 1.0, density: 1200, specificHeat: 1500, thickness: 0.005 }
    ] };
  } else {
    state = structuredClone(DEFAULT_STATE);
  }
  loadStateToInputs();
}

function qualitativeAssessment(results, best) {
  const tags = [];
  if (results.f === best.minF) tags.push(t('bestDamping'));
  if (results.delay === best.maxDelay) tags.push(t('largestDelay'));
  if (results.chi1 === best.maxChi1) tags.push(t('highestInternal'));
  if (!tags.length && Number.isFinite(results.f)) tags.push(results.f < 0.15 ? t('goodDamping') : results.f < 0.35 ? t('moderateDamping') : t('weakDamping'));
  return tags.join(', ');
}

function constructionLabel(index) {
  return String.fromCharCode(65 + (index % 26));
}
function renderComparisonInterpretation(saved, best) {
  const box = $('comparisonInterpretation');
  if (!saved.length) { box.innerHTML = ''; return; }
  if (saved.length === 1) {
    box.innerHTML = `<strong>${currentLang === 'de' ? 'Einordnung' : 'Interpretation'}:</strong> ${t('addTwo')}`;
    return;
  }
  const by = (key, val) => saved.find(x => x.results[key] === val)?.name || '–';
  box.innerHTML = `
    <strong>${t('quickComparison')}</strong>
    <ul>
      <li><strong>${t('bestSummerDamping')}</strong> ${esc(by('f', best.minF))} ${t('lowFExplain')} (${fmt(best.minF, 4)}).</li>
      <li><strong>${t('strongestReduction')}</strong> ${esc(by('damping', best.maxDamping))} ${t('highDampExplain')} (${fmt(best.maxDamping, 2)}).</li>
      <li><strong>${t('latestArrival')}</strong> ${esc(by('delay', best.maxDelay))} ${t('delayExplain')} (${fmt(best.maxDelay, 2)} h).</li>
      <li><strong>${t('bestBuffer')}</strong> ${esc(by('chi1', best.maxChi1))} ${t('bufferExplain')} (${fmt(best.maxChi1, 1)} kJ/(m²K)).</li>
    </ul>`;
}

function finiteValues(saved, key) { return saved.map(x => x.results[key]).filter(Number.isFinite); }
function comparisonBest(saved) {
  const getMin = (k) => Math.min(...finiteValues(saved, k));
  const getMax = (k) => Math.max(...finiteValues(saved, k));
  return { minF: getMin('f'), maxDamping: getMax('damping'), maxShift: getMax('shift'), maxDelay: getMax('delay'), maxChi1: getMax('chi1') };
}


function saveConstruction() {
  // Backward-compatible alias used by older buttons/files.
  addCurrentToComparison();
}


function renderComparison() {
  const saved = getComparisonSet();
  const best = saved.length ? comparisonBest(saved) : {};
  $('comparisonBody').innerHTML = saved.length ? saved.map((x, i) => `<tr>
    <td><strong>${constructionLabel(i)}</strong></td><td>${esc(x.name)}</td><td>${new Date(x.date).toLocaleDateString(currentLocale())}</td><td>${fmt(x.results.U0, 4)}</td><td>${fmt(x.results.Y12, 4)}</td><td>${fmt(x.results.shift, 2)}</td><td>${fmt(x.results.delay, 2)}</td><td>${fmt(x.results.f, 4)}</td><td>${fmt(x.results.damping, 2)}</td><td>${fmt(x.results.chi1, 1)}</td><td>${fmt(x.results.chi2, 1)}</td><td>${esc(qualitativeAssessment(x.results, best))}</td><td><button class="small" data-load="${x.id}">${t('load')}</button> <button class="small danger" data-del="${x.id}">${t('remove')}</button></td>
  </tr>`).join('') : `<tr><td colspan="13" class="empty">${t('noComparison')}</td></tr>`;
  $('comparisonBody').querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
    const item = saved.find(x => x.id === b.dataset.load); if (item) { state = structuredClone(item.state); loadStateToInputs(); }
  }));
  $('comparisonBody').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    setComparisonSet(saved.filter(x => x.id !== b.dataset.del)); renderComparison();
  }));
  renderComparisonInterpretation(saved, best);
  renderComparisonGraphic();
}

function renderComparisonGraphic() {
  const section = $('comparisonGraphicSection');
  const box = $('comparisonGraphic');
  if (!section || !box) return;
  const saved = getComparisonSet();
  if (!saved.length) {
    section.style.display = 'none';
    box.innerHTML = `<div class="empty">${t('graphicNoData')}</div>`;
    return;
  }
  section.style.display = '';
  const ranking = summerScore(saved);
  const bestOverall = ranking[0];
  const maxChi1 = bestBy(saved, 'chi1', 'max');
  const maxDelay = bestBy(saved, 'delay', 'max');
  const maxF = bestBy(saved, 'f', 'max');
  const panels = [
    { key:'delay', title:t('graphicDelay') + '<br><span class="g-subtitle">Delay h</span>', note:t('graphicHigherBetter'), decimals:2, better:'high', unit: currentLang==='de' ? 'Stunden [h]' : 'Hours [h]' },
    { key:'damping', title:t('graphicDamping'), note:t('graphicHigherBetter'), decimals:2, better:'high', unit:'1/f [-]' },
    { key:'f', title:t('graphicF'), note:t('graphicLowerBetter'), decimals:4, better:'low', unit:'f [-]' },
    { key:'chi1', title:t('graphicChi1'), note:t('graphicMoreInside'), decimals:1, better:'high', unit:'χ₁ [kJ/(m²K)]' },
    { key:'chi2', title:t('graphicChi2'), note:t('graphicMoreOutside'), decimals:1, better:'high', unit:'χ₂ [kJ/(m²K)]' }
  ];
  const barPanel = (cfg) => {
    const values = saved.map(x => Number(x.results[cfg.key])).filter(Number.isFinite);
    const maxVal = Math.max(...values, 0.0001);
    const maxForLow = Math.max(...values, 0.0001);
    return `<div class="g-card"><div class="g-card-title">${cfg.title}</div><div class="g-card-note">${cfg.note}</div><div class="g-bars">${saved.map((x,i)=>{ const v=Number(x.results[cfg.key]); const width = cfg.better==='low' ? (v/maxForLow)*100 : (v/maxVal)*100; return `<div class="g-bar-row"><div class="g-row-label"><span class="g-badge">${constructionLabel(i)}</span></div><div class="g-bar-track"><div class="g-bar ${cfg.better==='low'?'g-bar-low':''}" style="width:${Math.max(3,width)}%"></div></div><div class="g-value">${fmt(v,cfg.decimals)}</div></div>`; }).join('')}</div><div class="g-axis">${cfg.unit}</div></div>`;
  };
  const smallTable = (title,key,unit,decimals) => `<div class="g-table-card"><div class="g-table-title">${title}</div><table><thead><tr><th>${t('construction')}</th><th>${title} ${unit}</th></tr></thead><tbody>${saved.map((x,i)=>`<tr><td><span class="g-badge">${constructionLabel(i)}</span> ${esc(x.name)}</td><td>${fmt(x.results[key],decimals)}</td></tr>`).join('')}</tbody></table></div>`;
  box.innerHTML = `
    <div class="g-header">
      <div>
        <div class="g-title">${t('graphicSectionTitle')}</div>
        <div class="g-brand">ThermoWave | EN ISO 13786</div>
      </div>
      <div class="g-legend g-card">
        <div class="g-card-title">${t('graphicConstructions')}</div>
        ${saved.map((x,i)=>`<div class="g-legend-row"><span class="g-badge">${constructionLabel(i)}</span><span>${esc(x.name)}</span></div>`).join('')}
      </div>
    </div>
    <div class="g-panels">${panels.map(barPanel).join('')}</div>
    <div class="g-bottom">
      <div class="g-bottom-left">
        ${smallTable('U₀','U0','[W/(m²K)]',4)}
        ${smallTable('|Y₁₂|','Y12','[W/(m²K)]',4)}
        <div class="g-y12-explain">${t('y12Simple')}</div>
      </div>
      <div class="g-summary">
        <div class="g-summary-title">${t('graphicSummary')}</div>
        <div class="g-summary-note">${t('graphicScoreNote')}</div>
        <div class="g-summary-item"><strong>${t('graphicScoreTitle')}:</strong><br>${bestOverall ? `${t('constructionWord')} ${constructionLabel(bestOverall.index)} ${esc(bestOverall.item.name)}` : '–'}</div>
        <div class="g-summary-item"><strong>${t('graphicHighestInternal')}:</strong><br>${maxChi1 ? `${t('constructionWord')} ${constructionLabel(maxChi1.index)} ${esc(maxChi1.item.name)}` : '–'}</div>
        <div class="g-summary-item"><strong>${t('graphicWeakestDamping')}:</strong><br>${maxF ? `${t('constructionWord')} ${constructionLabel(maxF.index)} ${esc(maxF.item.name)}` : '–'}</div>
        <div class="g-summary-item"><strong>${t('graphicLargestDelay')}:</strong><br>${maxDelay ? `${t('constructionWord')} ${constructionLabel(maxDelay.index)} ${esc(maxDelay.item.name)}` : '–'}</div>
      </div>
    </div>`;
}

function bestBy(saved, key, mode='min') {
  let best = null;
  saved.forEach((x, i) => {
    const value = x.results[key];
    if (!Number.isFinite(value)) return;
    if (!best || (mode === 'min' ? value < best.value : value > best.value)) best = { item: x, index: i, value };
  });
  return best;
}
function compareSentence(best, keyLabel, explanation, unit='', decimals=3) {
  if (!best) return '';
  return `<li><strong>${t('constructionWord')} ${constructionLabel(best.index)} (${esc(best.item.name)})</strong> ${t('hasThe')} ${keyLabel}: ${fmt(best.value, decimals)}${unit}. ${explanation}</li>`;
}
function plainRankList(saved) {
  return saved.map((x, i) => {
    const amp = 12;
    const qDyn = x.results.Y12 * amp;
    const storage = x.results.chi1 * 10 * 2 / 3600;
    return `<tr><td><strong>${constructionLabel(i)}</strong></td><td>${esc(x.name)}</td><td>${fmt(qDyn, 1)} W/m²</td><td>${fmt(x.results.f * 100, 0)}%</td><td>${fmt(x.results.shift, 1)} h / ${fmt(x.results.delay, 1)} h ${currentLang === 'de' ? 'Verzögerung' : 'delay'}</td><td>${fmt(storage, 2)} kWh</td></tr>`;
  }).join('');
}
function summerScore(saved) {
  const vals = (k) => saved.map(x => x.results[k]).filter(Number.isFinite);
  const min = (a) => Math.min(...a), max = (a) => Math.max(...a);
  const ranges = { f: vals('f'), Y12: vals('Y12'), delay: vals('delay'), chi1: vals('chi1') };
  const normLow = (v, arr) => max(arr) === min(arr) ? 0.5 : (max(arr) - v) / (max(arr) - min(arr));
  const normHigh = (v, arr) => max(arr) === min(arr) ? 0.5 : (v - min(arr)) / (max(arr) - min(arr));
  return saved.map((x, i) => ({
    index: i,
    item: x,
    score: 0.40 * normLow(x.results.f, ranges.f) + 0.35 * normLow(x.results.Y12, ranges.Y12) + 0.20 * normHigh(x.results.delay, ranges.delay) + 0.05 * normHigh(x.results.chi1, ranges.chi1)
  })).sort((a, b) => b.score - a.score);
}
function generateComparativeReport() {
  const saved = getComparisonSet();
  const box = $('reportBox');
  if (!saved.length) { box.innerHTML = t('reportNone'); return; }
  if (saved.length === 1) { box.innerHTML = t('reportNeedTwo'); return; }
  const minF = bestBy(saved, 'f', 'min');
  const maxDamping = bestBy(saved, 'damping', 'max');
  const maxDelay = bestBy(saved, 'delay', 'max');
  const minY12 = bestBy(saved, 'Y12', 'min');
  const maxChi1 = bestBy(saved, 'chi1', 'max');
  const minU0 = bestBy(saved, 'U0', 'min');
  const ranking = summerScore(saved);
  const rows = saved.map((x, i) => `${t('constructionWord')} ${constructionLabel(i)} = ${esc(x.name)}`).join('; ');
  box.innerHTML = `
    <h3>${t('reportTitle')}</h3>
    <p>${rows}.</p>
    <h4>${t('plainExampleTitle')}</h4>
    <p>${t('reportIntro')}</p><p><strong>${currentLang === 'de' ? 'Hinweis' : 'Note'}:</strong> ${t('signNote')}</p>
    <table class="mini-report"><thead><tr><th>ID</th><th>${t('construction')}</th><th>${t('dynamicHeat')}</th><th>${t('remainingEffect')}</th><th>${t('peakShift')}</th><th>${t('roomBuffer')}</th></tr></thead><tbody>${plainRankList(saved)}</tbody></table>
    <h4>${t('techComparison')}</h4>
    <ul>
      ${compareSentence(minF, t('lowestF'), t('lowestFExpl'), '', 4)}
      ${compareSentence(maxDamping, t('highest1f'), t('highest1fExpl'), '', 2)}
      ${compareSentence(minY12, t('lowestY12'), t('lowestY12Expl'), ' W/(m²K)', 4)}
      ${compareSentence(maxDelay, t('largestPracticalDelay'), t('largestPracticalDelayExpl'), ' h', 2)}
      ${compareSentence(maxChi1, t('highestChi1'), t('highestChi1Expl'), ' kJ/(m²K)', 1)}
      ${compareSentence(minU0, t('lowestU0'), t('lowestU0Expl'), ' W/(m²K)', 4)}
    </ul>
    <h4>${t('overall')}</h4>
    <p><strong>${t('bestCombined')}</strong> ${t('constructionWord')} ${constructionLabel(ranking[0].index)} (${esc(ranking[0].item.name)}). ${t('rankingExplain')}</p>
    <p><strong>${t('howToRead')}</strong> ${t('howReadText')}</p>`;
}



function saveLocal() { localStorage.setItem('stw_current', JSON.stringify(state)); }
function loadLocal() {
  const local = localStorage.getItem('stw_current');
  if (local) { try { state = JSON.parse(local); } catch { state = structuredClone(DEFAULT_STATE); } }
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ state, library: getSavedLibrary(), comparison: getComparisonSet() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'summer-thermal-tool-data.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    if (data.state) state = data.state;
    if (data.library) localStorage.setItem('stw_library', JSON.stringify(data.library));
    if (data.comparison) localStorage.setItem('stw_comparison', JSON.stringify(data.comparison));
    if (data.saved && !data.library) localStorage.setItem('stw_library', JSON.stringify(data.saved));
    loadStateToInputs(); renderComparison();
  };
  reader.readAsText(file);
}
function exportMaterials() {
  const blob = new Blob([JSON.stringify({ meta: { exported: new Date().toISOString() }, materials: materialDb }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'materials.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importMaterials(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    materialDb = data.materials || data;
    saveMaterialsLocal();
    renderMaterialSelect();
  };
  reader.readAsText(file);
}

function bind() {
  ['projectName', 'periodSeconds', 'rsi', 'rse'].forEach(id => $(id).addEventListener('input', () => calculateAndRender(false)));
  $('useMaterial').addEventListener('click', useSelectedMaterial);
  $('addLayer').addEventListener('click', addLayerFromEditor);
  $('updateLayer').addEventListener('click', updateLayerFromEditor);
  $('cancelLayerEdit').addEventListener('click', clearLayerEditor);
  $('saveMaterial').addEventListener('click', saveCurrentEditorAsMaterial);
  $('clearLayers').addEventListener('click', clearLayers);
  $('loadDefault').addEventListener('click', () => loadExample('default'));
  $('loadD1').addEventListener('click', () => loadExample('d1'));
  $('loadD2').addEventListener('click', () => loadExample('d2'));
  
  $('saveToLibrary').addEventListener('click', () => saveCurrentConstructionToLibrary(false));
  $('addToComparison').addEventListener('click', addCurrentToComparison);
  $('loadSavedConstruction').addEventListener('click', () => loadSavedConstructionById($('savedConstructionSelect').value));
  $('deleteSavedConstruction').addEventListener('click', () => deleteSavedConstructionById($('savedConstructionSelect').value));
  $('newConstruction').addEventListener('click', newConstruction);
  $('newConstructionTop').addEventListener('click', newConstruction);
  $('generateReport').addEventListener('click', generateComparativeReport);
  $('clearComparison').addEventListener('click', () => { localStorage.removeItem('stw_comparison'); renderComparison(); });
  $('exportJson').addEventListener('click', exportJson);
  $('importJson').addEventListener('change', e => importJson(e.target.files[0]));
  $('exportMaterials').addEventListener('click', exportMaterials);
  $('importMaterials').addEventListener('change', e => importMaterials(e.target.files[0]));
  $('printPage').addEventListener('click', () => window.print());
  $('printLayerBuildUp').addEventListener('click', printLayerBuildUpOnly);
  $('printComparisonGraphic').addEventListener('click', printComparisonGraphicOnly);
  $('languageSelect').addEventListener('change', e => setLanguage(e.target.value));
}

async function init() {
  translateStatic();
  bind();
  try {
    const r = await fetch('materials.json');
    const db = await r.json();
    materialDb = db.materials || [];
  } catch {
    materialDb = [];
  }
  loadMaterialsLocal();
  renderMaterialSelect();
  renderSavedConstructionSelect();
  loadLocal();
  loadStateToInputs();
  renderComparison();
}

document.addEventListener('DOMContentLoaded', init);

// Expose for simple browser-console verification.
window.STW = { calculate, loadExampleState: (kind) => kind === 'd1' ? { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] } : structuredClone(DEFAULT_STATE) };
