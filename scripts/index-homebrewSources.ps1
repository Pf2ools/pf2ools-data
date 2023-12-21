PARAM(
	# Forces the script to write a file even if there are duplicates.
	[switch]$IgnoreCollisions,
	# Compresses the JSON output
	[switch]$Compress
)

$index = [hashtable]::new()
$collisions = [System.Collections.Generic.List[String]]::new()

Get-ChildItem ./bundles/bySource/homebrew/* -File | ForEach-Object {
	$file = Get-Content $_ -Encoding utf8NoBOM | ConvertFrom-Json

	if (-not $file.source) {
		Write-Error "Source object not found in ""$($_.Name)"""
		exit 1
	}

	if ($index.($file.source.ID)) {
		# Note PS is case-insensitive so handles those collisions automatically
		if ($IgnoreCollisions) {
			Write-Warning "ID collision at ""$($file.source.ID)"" skipped"
		} else {
			Write-Error "ID collision at ""$($file.source.ID)"""
			exit 1
		}
		$IDs.PSObject.Properties.Remove($file.source.ID)
		$collisions.Add($file.source.ID)
	} elseif ($collisions -contains $file.source.ID) {
		# Do nothing
	} else {
		$index.($file.source.ID) = [PSCustomObject]@{
			path             = 'bundles/bySource/homebrew/' + ($_.Name -replace '\\', '/' -replace '^./')
			fullTitle        = $file.source.title.full
			publisherAuthors = $file.source.data.publisher ?? (($file.source.data.authors.Count -gt 3 ? ($file.source.data.authors[0..2], 'et al.') : $file.source.data.authors) -join ', ')
			released         = $file.source.data.released
			added            = $file.source.data.added
			modified         = $file.source.data.modified
			tags             = $file.source.tags
			datatypes        = $file.PSObject.Properties.Name -ne 'source'
		}
	}
}

$index
| ConvertTo-Json -Depth 4 -Compress:$Compress
| Out-File -FilePath ./indexes/homebrewSources.json -Encoding utf8NoBOM
Write-Output 'Index written to ./indexes/homebrewSources.json'