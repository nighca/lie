// Actual integration used after prepare(), loadQuestion(), makeRecorder(), makeFullGameCapture().
// diagnostic=createVoiceDiagnostics(); methods=diagnostics.methods; cursor captured after Network.enable.
try {
  nodeRepl.write(await capture.start());
} catch (error) {
  nodeRepl.write({ failed: true, error: String(error), outcome: capture.outcome });
}
let networkPart = await gameCdp.readEvents({ afterSequence: cursor, methods, limit: 1000 });
cursor = networkPart.cursor;
for (const event of networkPart.events) diagnostic.accept(event);
nodeRepl.write(diagnostic.snapshot());
await fs.writeFile(root + '/network.json', JSON.stringify(diagnostic.snapshot(), null, 2));
// The actual failing start already called safeStep->cleanup; no retry followed.
await capture.exportAll();
await fs.writeFile(root + '/failure.jpg', await gameTab.screenshot({ fullPage: false }));
await gameCdp.send('Network.disable');
await gameCdp.send('Runtime.evaluate', {
  expression: 'document.getElementById("lie-recording-pointer")?.remove();delete window.__lieAudioCapture',
  returnByValue: true,
});
await gameCdp.send('Emulation.clearDeviceMetricsOverride');
await viewport.reset();
