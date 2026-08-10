Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class LogoProcessor {
  public static void RemoveGreen(string input, string output) {
    using (var source = new Bitmap(input))
    using (var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (var graphics = Graphics.FromImage(bitmap)) graphics.DrawImageUnscaled(source, 0, 0);
      var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
      var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      var bytes = new byte[Math.Abs(data.Stride) * bitmap.Height];
      Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
      for (var y = 0; y < bitmap.Height; y++) {
        for (var x = 0; x < bitmap.Width; x++) {
          var i = y * data.Stride + x * 4;
          var b = bytes[i]; var g = bytes[i + 1]; var r = bytes[i + 2];
          var score = g - Math.Max(r, b);
          if (g > 130 && score > 45) {
            bytes[i + 3] = (byte)Math.Max(0, Math.Min(255, 255 - (score - 45) * 3));
            if (bytes[i + 3] < 245) bytes[i + 1] = (byte)Math.Min(g, Math.Max(r, b));
          }
        }
      }
      Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
      bitmap.UnlockBits(data);
      bitmap.Save(output, ImageFormat.Png);
    }
  }

  public static void Resize(string input, string output, int size) {
    using (var source = new Bitmap(input))
    using (var target = new Bitmap(size, size, PixelFormat.Format32bppArgb))
    using (var graphics = Graphics.FromImage(target)) {
      graphics.Clear(Color.Transparent);
      graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
      graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
      graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
      graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
      graphics.DrawImage(source, new Rectangle(0, 0, size, size));
      target.Save(output, ImageFormat.Png);
    }
  }

  public static void CreateIco(string input, string output) {
    var pngPath = output + ".png.tmp";
    Resize(input, pngPath, 64);
    var png = File.ReadAllBytes(pngPath);
    using (var stream = File.Create(output))
    using (var writer = new BinaryWriter(stream)) {
      writer.Write((ushort)0); writer.Write((ushort)1); writer.Write((ushort)1);
      writer.Write((byte)64); writer.Write((byte)64); writer.Write((byte)0); writer.Write((byte)0);
      writer.Write((ushort)1); writer.Write((ushort)32);
      writer.Write((uint)png.Length); writer.Write((uint)22); writer.Write(png);
    }
    File.Delete(pngPath);
  }
}
'@

$root = (Resolve-Path '.').Path
$input = Join-Path $root 'tmp\imagegen\logo-premium-chroma.png'
$transparent = Join-Path $root 'tmp\imagegen\logo-premium-transparent.png'
[LogoProcessor]::RemoveGreen($input, $transparent)
[LogoProcessor]::Resize($transparent, (Join-Path $root 'public\logo.png'), 512)
[LogoProcessor]::Resize($transparent, (Join-Path $root 'public\icon-192.png'), 192)
[LogoProcessor]::Resize($transparent, (Join-Path $root 'public\apple-touch-icon.png'), 180)
[LogoProcessor]::Resize($transparent, (Join-Path $root 'public\favicon-32.png'), 32)
[LogoProcessor]::Resize($transparent, (Join-Path $root 'public\favicon-16.png'), 16)
[LogoProcessor]::CreateIco($transparent, (Join-Path $root 'public\favicon.ico'))
[LogoProcessor]::Resize($transparent, (Join-Path $root 'src\assets\logo\logo.png'), 512)
