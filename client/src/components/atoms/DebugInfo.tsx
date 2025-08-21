import React, { useState, useEffect } from 'react';
import { gameService } from '../../services/gameService';
import config from '../../config';
import { Modal } from './Modal';

interface DebugInfoProps {
  open: boolean;
  onClose: () => void;
}

interface ConnectionInfo {
  clientURL: string;
  clientIP: string;
  serverURL: string;
  websocketURL: string;
  isConnected: boolean;
  lastError: string | null;
  corsErrors: string[];
  userAgent: string;
  timestamp: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ open, onClose }) => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshConnectionInfo = async () => {
    setRefreshing(true);
    
    try {
      // Get client info
      const clientURL = window.location.href;
      const clientIP = window.location.hostname;
      
      // Get real-time server URLs (not cached config)
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      const realTimeServerURL = `${protocol}//${hostname}:3002`;
      const realTimeWebSocketURL = `${protocol}//${hostname}:3002`;
      
      // Test server connectivity
      let serverStatus = 'Unknown';
      let lastError: string | null = null;
      let corsErrors: string[] = [];
      
      try {
        console.log(`🔧 [DEBUG] Testing connectivity to: ${realTimeServerURL}/health`);
        
        const response = await fetch(`${realTimeServerURL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors', // Explicitly test CORS
        });
        
        console.log(`🔧 [DEBUG] Health check response:`, response.status, response.statusText);
        
        if (response.ok) {
          serverStatus = 'Connected';
        } else {
          serverStatus = `HTTP ${response.status}`;
          lastError = `Server responded with status ${response.status}: ${response.statusText}`;
        }
      } catch (error: any) {
        console.error(`🔧 [DEBUG] Connectivity test failed:`, error);
        serverStatus = 'Failed';
        lastError = error.message;
        
        // Check for CORS-specific errors
        if (error.message.includes('CORS') || 
            error.message.includes('Access-Control-Allow-Origin') ||
            error.message.includes('cross-origin')) {
          corsErrors.push(error.message);
        }
        
        // Check for network errors that might indicate CORS
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('Network Error')) {
          corsErrors.push('Possible CORS error: Failed to fetch from server');
        }
      }

      // Check WebSocket status
      const wsConnected = gameService.isConnected();
      
      const info: ConnectionInfo = {
        clientURL,
        clientIP,
        serverURL: `${realTimeServerURL} (config: ${config.api.baseUrl})`,
        websocketURL: `${realTimeWebSocketURL} (config: ${config.websocket.url})`,
        isConnected: wsConnected,
        lastError,
        corsErrors,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
      
      setConnectionInfo(info);
    } catch (error) {
      console.error('Error gathering debug info:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open) {
      refreshConnectionInfo();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="🔧 Debug Information">
      <div className="debug-info space-y-4 max-h-96 overflow-y-auto">
        {/* Refresh Button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Connection Status</h3>
          <button
            onClick={refreshConnectionInfo}
            disabled={refreshing}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {refreshing ? '🔄' : '↻'} Refresh
          </button>
        </div>

        {connectionInfo ? (
          <div className="space-y-4">
            {/* Client Information */}
            <div className="debug-section">
              <h4 className="font-medium text-gray-800 mb-2">📱 Client Information</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
                <div><strong>Client URL:</strong> {connectionInfo.clientURL}</div>
                <div><strong>Client IP/Host:</strong> {connectionInfo.clientIP}</div>
                <div><strong>User Agent:</strong> {connectionInfo.userAgent.slice(0, 80)}...</div>
                <div><strong>Timestamp:</strong> {new Date(connectionInfo.timestamp).toLocaleString()}</div>
              </div>
            </div>

            {/* Server Connection */}
            <div className="debug-section">
              <h4 className="font-medium text-gray-800 mb-2">🌐 Server Connection</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
                <div><strong>API Server:</strong> {connectionInfo.serverURL}</div>
                <div><strong>WebSocket:</strong> {connectionInfo.websocketURL}</div>
                <div>
                  <strong>WS Connected:</strong> 
                  <span className={connectionInfo.isConnected ? 'text-green-600' : 'text-red-600'}>
                    {connectionInfo.isConnected ? ' ✅ Yes' : ' ❌ No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Information */}
            {(connectionInfo.lastError || connectionInfo.corsErrors.length > 0) && (
              <div className="debug-section">
                <h4 className="font-medium text-red-600 mb-2">⚠️ Errors</h4>
                <div className="bg-red-50 p-3 rounded text-sm space-y-2">
                  {connectionInfo.lastError && (
                    <div>
                      <strong>Last Error:</strong>
                      <div className="text-red-700 font-mono mt-1">{connectionInfo.lastError}</div>
                    </div>
                  )}
                  {connectionInfo.corsErrors.length > 0 && (
                    <div>
                      <strong>CORS Issues:</strong>
                      {connectionInfo.corsErrors.map((error, index) => (
                        <div key={index} className="text-red-700 font-mono mt-1">
                          • {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Status */}
            {!connectionInfo.lastError && connectionInfo.corsErrors.length === 0 && connectionInfo.isConnected && (
              <div className="debug-section">
                <div className="bg-green-50 p-3 rounded text-sm">
                  <span className="text-green-700 font-medium">✅ All connections working properly!</span>
                </div>
              </div>
            )}

            {/* Network Diagnostics */}
            <div className="debug-section">
              <h4 className="font-medium text-gray-800 mb-2">🔍 Network Diagnostics</h4>
              <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
                <div><strong>Access Type:</strong> 
                  <span className={connectionInfo.clientIP === 'localhost' ? 'text-orange-600' : 'text-green-600'}>
                    {connectionInfo.clientIP === 'localhost' ? ' Local access' : ' External access'}
                  </span>
                </div>
                <div className="mt-2">
                  <strong>For external users:</strong>
                </div>
                <div className="font-mono text-xs text-gray-600 ml-4">
                  • Replace 'localhost' with your external IP in both client and server URLs
                </div>
                <div className="font-mono text-xs text-gray-600 ml-4">
                  • Ensure router port forwarding is configured
                </div>
                <div className="font-mono text-xs text-gray-600 ml-4">
                  • Check firewall allows connections on both ports
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Loading debug information...</div>
        )}
      </div>
    </Modal>
  );
};