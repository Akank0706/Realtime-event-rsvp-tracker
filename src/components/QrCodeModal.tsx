import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { EventData } from '../firebase/firestoreTypes';
import { X, Copy, Check, Download, QrCode, Share2 } from 'lucide-react';

interface QrCodeModalProps {
  event: EventData | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ event, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const inviteUrl = event
    ? `${window.location.origin}/?event=${event.id}`
    : '';

  useEffect(() => {
    if (!event) return;
    QRCode.toDataURL(inviteUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [event, inviteUrl]);

  if (!event) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${event.id}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 line-clamp-1">{event.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Scan to discover event & submit real-time RSVP</p>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Event QR Code" className="w-48 h-48 rounded" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
              Generating Cloud QR...
            </div>
          )}
        </div>

        {/* Link Input & Copy */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-2 text-gray-600 select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            onClick={handleDownloadQr}
            className="w-full py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded flex items-center justify-center transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download QR Badge (PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
