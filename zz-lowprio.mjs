// The Chrome of Playwright and every process it starts: Idle priority and at most 60% of the CPU (a job object), by cap.ps1, while it runs.
import { execFile, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function lowPriority () {
	const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(here, 'zz-cap.ps1'), '-Percent', '60'], {windowsHide: true, stdio: 'ignore', detached: false});

	child.unref();

	return child;
}

/* What priority each process of the tree has now, counted. */
export function priorities (browser, callback) {
	const script = "$all = Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId, CommandLine, Name; $tree = @($all | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -match 'remote-debugging-pipe' } | ForEach-Object { [int]$_.ProcessId }); $grown = $true; while ($grown) { $grown = $false; foreach ($one in $all) { if ($tree -contains [int]$one.ParentProcessId -and -not ($tree -contains [int]$one.ProcessId)) { $tree += [int]$one.ProcessId; $grown = $true } } }; $tree | ForEach-Object { try { (Get-Process -Id $_ -ErrorAction Stop).PriorityClass } catch {} } | Group-Object | ForEach-Object { $_.Name + ':' + $_.Count }";

	execFile('powershell.exe', ['-NoProfile', '-Command', script], {windowsHide: true}, (error, out) => callback(String(out).trim().replace(/\r?\n/g, ' ')));
}
