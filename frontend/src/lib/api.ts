import { StatusResponse, Region } from "../types";

export async function takeScreenshot(): Promise<string> {
  const response = await fetch("/api/screenshot");
  if (!response.ok) {
    throw new Error(`Failed to take screenshot: ${response.statusText}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getStatus(): Promise<StatusResponse> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error(`Error fetching status: ${response.statusText}`);
  }
  return response.json();
}

export async function setRegion(region: Region): Promise<void> {
  const response = await fetch("/api/region", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ region }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set region: ${response.statusText}`);
  }
}

export async function startMonitoring(): Promise<void> {
  const response = await fetch("/api/monitor/start", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to start monitoring: ${response.statusText}`);
  }
}

export async function stopMonitoring(): Promise<void> {
  const response = await fetch("/api/monitor/stop", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to stop monitoring: ${response.statusText}`);
  }
}

export async function getLatestScreenshot(): Promise<string | null> {
  const timestamp = new Date().getTime();
  const response = await fetch(`/api/latest-screenshot?t=${timestamp}`);

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Error fetching screenshot: ${response.status} ${response.statusText}`,
    );
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    return null;
  }

  return URL.createObjectURL(blob);
}
