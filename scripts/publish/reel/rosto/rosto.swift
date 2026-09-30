// Detector de rosto (Apple Vision) pro recorte vertical do reel. Lê um vídeo, amostra
// a cada `passo` segundos e imprime JSON: [{t, x, y, w, h, conf}] do maior rosto de cada
// quadro (coordenadas 0 a 1, origem no canto de cima à esquerda). Sem rosto: x = null.
//   swift rosto.swift <video> [passo=0.1]
import AVFoundation
import Vision
import Foundation

let args = CommandLine.arguments
guard args.count >= 2 else { fputs("uso: rosto.swift <video> [passo]\n", stderr); exit(1) }
let passo = args.count >= 3 ? Double(args[2]) ?? 0.1 : 0.1
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let dur = CMTimeGetSeconds(asset.duration)
var saida: [[String: Any]] = []
var t = 0.0
while t < dur {
  var item: [String: Any] = ["t": (t * 1000).rounded() / 1000]
  if let img = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) {
    let req = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
    let rostos = (req.results ?? []).sorted { $0.boundingBox.width * $0.boundingBox.height > $1.boundingBox.width * $1.boundingBox.height }
    if let r = rostos.first {
      let b = r.boundingBox
      item["x"] = b.midX; item["y"] = 1 - b.midY; item["w"] = b.width; item["h"] = b.height; item["conf"] = r.confidence
    }
  }
  saida.append(item)
  t += passo
}
let json = try! JSONSerialization.data(withJSONObject: saida)
print(String(data: json, encoding: .utf8)!)
