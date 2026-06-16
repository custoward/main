// PDF의 각 페이지를 JPEG로 변환하고 manifest.json을 생성한다.
// macOS 내장 프레임워크만 사용 (별도 설치 불필요).
//   사용법: swift scripts/pdfToImages.swift <input.pdf> <outDir> [width]
//   예:     swift scripts/pdfToImages.swift catalog_src/TheChairCatalog.pdf public/catalog 1500
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("usage: swift pdfToImages.swift <input.pdf> <outDir> [width]")
  exit(1)
}
let inputPath = args[1]
let outDir = args[2]
let targetWidth = CGFloat(args.count >= 4 ? (Double(args[3]) ?? 1500) : 1500)

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

guard let doc = CGPDFDocument(URL(fileURLWithPath: inputPath) as CFURL) else {
  print("PDF 열기 실패: \(inputPath)")
  exit(1)
}

var names: [String] = []
for i in 1...doc.numberOfPages {
  guard let page = doc.page(at: i) else { continue }
  let box = page.getBoxRect(.cropBox)
  let scale = targetWidth / box.width
  let w = Int((box.width * scale).rounded())
  let h = Int((box.height * scale).rounded())

  guard let ctx = CGContext(
    data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
  ) else { continue }

  ctx.interpolationQuality = .high
  ctx.setFillColor(red: 1, green: 1, blue: 1, alpha: 1)
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale)
  ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
  ctx.drawPDFPage(page)

  guard let img = ctx.makeImage() else { continue }
  let name = String(format: "page-%03d.jpg", i)
  let outURL = URL(fileURLWithPath: outDir).appendingPathComponent(name)
  guard let dest = CGImageDestinationCreateWithURL(
    outURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil
  ) else { continue }
  CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
  if CGImageDestinationFinalize(dest) {
    names.append(name)
    print("✓ \(name) (\(w)x\(h))")
  }
}

let manifest: [String: Any] = ["count": names.count, "pages": names]
let data = try! JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try! data.write(to: URL(fileURLWithPath: outDir).appendingPathComponent("manifest.json"))
print("완료: \(names.count) 페이지 → \(outDir)")
