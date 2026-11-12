param([int]$Percent = 60)

# The Chrome of Playwright and all it starts: Idle priority, and a job capping it to $Percent of the CPU (hard cap).
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class Cap {
	[StructLayout(LayoutKind.Sequential)]
	public struct Rate { public uint Flags; public uint CpuRate; }

	[DllImport("kernel32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr CreateJobObject(IntPtr a, string name);
	[DllImport("kernel32.dll")] public static extern bool SetInformationJobObject(IntPtr job, int kind, ref Rate info, uint size);
	[DllImport("kernel32.dll")] public static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
	[DllImport("kernel32.dll")] public static extern IntPtr OpenProcess(uint access, bool inherit, int id);
	[DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);

	public static IntPtr Make(uint percent) {
		IntPtr job = CreateJobObject(IntPtr.Zero, null);
		Rate rate = new Rate();
		rate.Flags = 0x1 | 0x4;
		rate.CpuRate = percent * 100;
		SetInformationJobObject(job, 15, ref rate, (uint)Marshal.SizeOf(typeof(Rate)));
		return job;
	}

	public static bool Put(IntPtr job, int id) {
		IntPtr process = OpenProcess(0x0100 | 0x0001 | 0x0200 | 0x0400, false, id);
		if (process == IntPtr.Zero) return false;
		bool done = AssignProcessToJobObject(job, process);
		CloseHandle(process);
		return done;
	}
}
"@

$job = [Cap]::Make([uint32]$Percent)
$placed = @{}

$seen = $false
$idle = 0

# The root: the Chrome of Playwright (started with --remote-debugging-pipe; the user's own Chrome is not); its tree from it.
while ($true) {
	$all = Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId, CommandLine, Name
	$tree = @($all | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -match 'remote-debugging-pipe' } | ForEach-Object { [int]$_.ProcessId })

	if ($tree.Count -eq 0) {
		$idle++

		if ($seen -or $idle -gt 60) { break }

		Start-Sleep -Milliseconds 500

		continue
	}

	$seen = $true
	$grown = $true

	while ($grown) {
		$grown = $false

		foreach ($one in $all) {
			if ($tree -contains [int]$one.ParentProcessId -and -not ($tree -contains [int]$one.ProcessId)) {
				$tree += [int]$one.ProcessId
				$grown = $true
			}
		}
	}

	foreach ($id in $tree) {
		try {
			$p = Get-Process -Id $id -ErrorAction Stop

			if ($p.PriorityClass -ne 'Idle') { $p.PriorityClass = 'Idle' }

			if (-not $placed[$id]) { $placed[$id] = [Cap]::Put($job, $id) }
		}
		catch {}
	}

	Start-Sleep -Milliseconds 1500
}
