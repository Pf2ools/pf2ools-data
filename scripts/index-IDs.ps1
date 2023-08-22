PARAM(
	# Forces the script to write a file even if there are duplicates.
	[switch]$IgnoreCollisions,
	# Compresses the JSON output
	[switch]$Compress
)

$IDs = [PSCustomObject]::new()
$collisions = [System.Collections.Generic.List[String]]::new()

Get-ChildItem ./data/*/*/* -File | ForEach-Object {
	$path = (Resolve-Path $_.FullName -Relative) -replace '\\', '/'
	$file = Get-Content $_ -Encoding utf8NoBOM | ConvertFrom-Json

	if ($IDs.($file.ID)) {
		# Note PS is case-insensitive so handles those collisions automatically
		if ($IgnoreCollisions) {
			Write-Warning "ID collision at ""$($file.ID)"" skipped"
		} else {
			throw "ID collision at ""$($file.ID)"""
		}
		$IDs.PSObject.Properties.Remove($file.ID)
		$collisions.Add($file.ID)
	} elseif ($collisions -contains $file.ID) {
		# Do nothing
	} else {
		$IDs | Add-Member -NotePropertyName $file.ID -NotePropertyValue (
			[PSCustomObject]@{
				type      = $file.type
				fullTitle = $file.title.full
				path      = $path
				official  = $file.type -eq 'source' ? ($file.tags.misc.official ? $true : $false) : $null
			}
		)
	}
}

$IDs
| ConvertTo-Json -Depth 2 -Compress:$Compress
| Out-File -FilePath ./indexes/IDs.json -Encoding utf8NoBOM
Write-Output 'Index written to ./indexes/IDs.json'
