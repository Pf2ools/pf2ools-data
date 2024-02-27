param(
	# Tells the script to ignore any content-less sources
	[switch]$SkipEmpty,
	# Compresses the JSON output
	[switch]$Compress
)

function Group-SourceContent {
	param (
		# Source directory to be grouped
		[Parameter(Mandatory)]
		[string]
		$SourcePath,
		# Override for when the path isn't actually a source and this is a terrible hack
		[switch]$NoSource
	)
	process {
		$bundle = if ($NoSource) {
			[pscustomobject]::new()
		} else {
			[pscustomobject]@{
				source = @(Get-ChildItem $SourcePath -File | Get-Content -Encoding utf8NoBOM | ConvertFrom-Json)
			}
		}
		Get-ChildItem $SourcePath -Directory | ForEach-Object {
			$content = [System.Collections.Generic.List[pscustomobject]]::new()
			Get-ChildItem $_.FullName -File | ForEach-Object {
				$content.Add(
					(Get-Content $_ -Encoding utf8NoBOM | ConvertFrom-Json)
				)
			}
			$bundle | Add-Member -NotePropertyName $_.Name -NotePropertyValue @($content)
		}

		$bundle
	}
}

Write-Host 'Deleting existing bundle...'
if (Test-Path ./bundles/bySource) {
	Get-ChildItem ./bundles/bySource -Recurse -File | Remove-Item
}

$count = @{}
$skips = @{}
foreach ($family in @('core', 'homebrew')) {
	Write-Host "`nBundling $family content by source..."
	if (-not (Test-Path "./bundles/bySource/$family")) {
		$null = mkdir "./bundles/bySource/$family"
		Write-Host "`nCreated directory ./bundles/bySource/$family"
	}
	$count.$family = 0
	$skips.$family = 0
	Get-ChildItem "./data/$family" -Directory |
		ForEach-Object {
			$bundle = Group-SourceContent $_
			if ($SkipEmpty -and $bundle.PSObject.Properties.Name.Count -lt 2) {
				$skips.$family++
				Write-Host "`tSkipped empty source ""$($_.Name)"""
			} else {
				$bundle
				| ConvertTo-Json -Depth 99 -Compress
				| Out-File -FilePath "./bundles/bySource/$family/$($_.Name).json"
				$count.$family++
				Write-Host "`tBundled ""$($_.Name)"""
			}
		}
	if ($SkipEmpty) {
		Write-Host "Bundled $($count.$family) $family sources into ./bundles/$family (skipped $($skips.$family))"
	} else {
		Write-Host "Bundled $($count.$family) $family sources into ./bundles/$family"
	}
}
if ($SkipEmpty) {
	Write-Host "`nBundled a total of $($count.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum) sources into ./bundles/bySource (skipped $($skips.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum))"
} else {
	Write-Host "`nBundled a total of $($count.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum) sources into ./bundles/bySource"
}

Write-Host "`nBundling common files..."
Group-SourceContent './data/common' -NoSource
| ConvertTo-Json -Depth 99 -Compress:$Compress
| Out-File './bundles/bySource/common.json'

Write-Host "`nBundled everything into ./bundles/bySource"
