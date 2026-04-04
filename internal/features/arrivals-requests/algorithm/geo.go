package algorithm

import (
	"crypto/sha256"
	"encoding/binary"
	"math"
	"strings"
)

// ──────────────────────────────────────────────────────────────────────────────
// Fully offline geo-distance calculation.
//
// No external APIs — instant, deterministic, never fails.
//
// Approach:
//  1. Parse city name from the address string.
//  2. Look up base coordinates for the city (hardcoded table of major cities).
//  3. Generate a stable street-level offset from a hash of the full address
//     (so the same address always maps to the same point).
//  4. Haversine between two generated points → distance in km.
//
// Accuracy: sufficient for logistics prioritization (same city ~0-15 km,
// different cities ~real intercity distance). Not GPS-precise, but
// consistent and logically correct.
// ──────────────────────────────────────────────────────────────────────────────

// GeoPoint holds WGS-84 coordinates.
type GeoPoint struct {
	Lat float64
	Lon float64
}

// RouteResult holds distance info between two points.
type RouteResult struct {
	DistanceKm float64
}

// ──────────────────────────────────────────────────────────────────────────────
// City coordinate table
// ──────────────────────────────────────────────────────────────────────────────

// cityCoords maps lowercase city keywords to approximate city-center coords.
var cityCoords = map[string]GeoPoint{
	"львів":            {Lat: 49.8397, Lon: 24.0297},
	"львов":            {Lat: 49.8397, Lon: 24.0297},
	"lviv":             {Lat: 49.8397, Lon: 24.0297},
	"київ":             {Lat: 50.4501, Lon: 30.5234},
	"киев":             {Lat: 50.4501, Lon: 30.5234},
	"kyiv":             {Lat: 50.4501, Lon: 30.5234},
	"одеса":            {Lat: 46.4825, Lon: 30.7233},
	"одесса":           {Lat: 46.4825, Lon: 30.7233},
	"odesa":            {Lat: 46.4825, Lon: 30.7233},
	"харків":           {Lat: 49.9935, Lon: 36.2304},
	"харьков":          {Lat: 49.9935, Lon: 36.2304},
	"kharkiv":          {Lat: 49.9935, Lon: 36.2304},
	"дніпро":           {Lat: 48.4647, Lon: 35.0462},
	"днепр":            {Lat: 48.4647, Lon: 35.0462},
	"dnipro":           {Lat: 48.4647, Lon: 35.0462},
	"запоріжжя":        {Lat: 47.8388, Lon: 35.1396},
	"запорожье":        {Lat: 47.8388, Lon: 35.1396},
	"вінниця":          {Lat: 49.2331, Lon: 28.4682},
	"тернопіль":        {Lat: 49.5535, Lon: 25.5948},
	"івано-франківськ": {Lat: 48.9226, Lon: 24.7111},
	"ужгород":          {Lat: 48.6208, Lon: 22.2879},
	"чернівці":         {Lat: 48.2920, Lon: 25.9358},
	"рівне":            {Lat: 50.6199, Lon: 26.2516},
	"луцьк":            {Lat: 50.7472, Lon: 25.3254},
	"полтава":          {Lat: 49.5883, Lon: 34.5514},
	"черкаси":          {Lat: 49.4444, Lon: 32.0598},
	"суми":             {Lat: 50.9077, Lon: 34.7981},
	"житомир":          {Lat: 50.2547, Lon: 28.6587},
	"хмельницький":     {Lat: 49.4229, Lon: 26.9871},
	"кропивницький":    {Lat: 48.5079, Lon: 32.2623},
	"миколаїв":         {Lat: 46.9750, Lon: 31.9946},
	"херсон":           {Lat: 46.6354, Lon: 32.6169},
	"чернігів":         {Lat: 51.4982, Lon: 31.2893},
}

// defaultCity is used when no city is detected in the address.
var defaultCity = GeoPoint{Lat: 49.8397, Lon: 24.0297} // Lviv

// ──────────────────────────────────────────────────────────────────────────────
// Address → GeoPoint
// ──────────────────────────────────────────────────────────────────────────────

// addressToPoint converts an address string to a stable GeoPoint.
// It finds the city center and adds a deterministic offset based on the
// street part of the address (±0.05° ≈ ±5 km from center).
func addressToPoint(address string) GeoPoint {
	lower := strings.ToLower(address)
	center := findCityCenter(lower)

	// Generate a stable offset from the address hash.
	// This ensures the same address always produces the same point,
	// and different addresses on different streets produce different points.
	h := sha256.Sum256([]byte(lower))
	latOffset := hashToOffset(h[0:8])  // range: -0.05 to +0.05 degrees (~5 km)
	lonOffset := hashToOffset(h[8:16]) // range: -0.05 to +0.05 degrees (~5 km)

	return GeoPoint{
		Lat: center.Lat + latOffset,
		Lon: center.Lon + lonOffset,
	}
}

// findCityCenter looks for a known city name in the address.
func findCityCenter(lowerAddress string) GeoPoint {
	for keyword, center := range cityCoords {
		if strings.Contains(lowerAddress, keyword) {
			return center
		}
	}
	return defaultCity
}

// hashToOffset converts 8 bytes to a float64 in [-0.05, +0.05].
func hashToOffset(b []byte) float64 {
	n := binary.BigEndian.Uint64(b)
	// Normalize to [0, 1) then shift to [-0.05, +0.05]
	normalized := float64(n) / float64(math.MaxUint64)
	return (normalized - 0.5) * 0.1
}

// ──────────────────────────────────────────────────────────────────────────────
// Haversine distance
// ──────────────────────────────────────────────────────────────────────────────

const earthRadiusKm = 6371.0

func haversineKm(a, b GeoPoint) float64 {
	dLat := degToRad(b.Lat - a.Lat)
	dLon := degToRad(b.Lon - a.Lon)

	lat1 := degToRad(a.Lat)
	lat2 := degToRad(b.Lat)

	h := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(h), math.Sqrt(1-h))
	return earthRadiusKm * c
}

func degToRad(deg float64) float64 {
	return deg * math.Pi / 180.0
}

// roadFactor converts straight-line distance to estimated road distance.
// Urban roads are typically ~1.3–1.5× straight line.
const roadFactor = 1.35

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

// GetDistanceKm returns the estimated road distance between two addresses.
// Fully offline — no external API calls. Instant. Never fails.
func GetDistanceKm(fromAddress, toAddress string) float64 {
	if fromAddress == toAddress {
		return 0.0
	}

	from := addressToPoint(fromAddress)
	to := addressToPoint(toAddress)

	straight := haversineKm(from, to)
	return straight * roadFactor
}
