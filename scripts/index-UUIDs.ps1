PARAM(
	# Forces the script to write a file even if there are duplicates.
	[switch]$IgnoreCollisions,
	# Compresses the JSON output
	[switch]$Compress
)

$UUIDs = [hashtable]::new()
$collisions = [System.Collections.Generic.List[String]]::new()

Get-ChildItem ./data/*/*/*/* -File | ForEach-Object {
	$path = (Resolve-Path $_.FullName -Relative) -replace '\\', '/' -replace '^\./'
	$file = Get-Content $_ -Encoding utf8NoBOM | ConvertFrom-Json

	$UUID = $file.type + '|' + $file.name.primary + '|' + $file.source.ID + '|' + $file.name.specifier

	if ($UUIDs.($UUID)) {
		# Note PS is case-insensitive so handles those collisions automatically
		if ($IgnoreCollisions) {
			Write-Warning "UUID collision at ""$($UUID)"" skipped"
		} else {
			Write-Error "UUID collision at ""$($UUID)"""
			exit 1
		}
		$UUIDs.Remove($UUID)
		$collisions.Add($UUID)
	} elseif ($collisions -contains $UUID) {
		# Do nothing
	} else {
		$UUIDs.$UUID = @{
			path = $path
		}
		if ($file.reference) {
			$UUIDs.$UUID.reference = $file.reference.type
		}
	}
}

$UUIDs
| ConvertTo-Json -Depth 2 -Compress:$Compress
| Out-File -FilePath ./indexes/UUIDs.json -Encoding utf8NoBOM
Write-Output 'Index written to ./indexes/UUIDs.json'
