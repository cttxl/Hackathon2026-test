package algorithm

import (
	"crypto/sha256"
	"encoding/binary"
	"math"
	"strings"
)

// ──────────────────────────────────────────────────────────────────────────────
// Offline geo-distance for Lviv and Lviv Oblast streets.
//
// No external APIs — instant, deterministic, never fails.
//
// Approach:
//  1. Extract street name from the address.
//  2. Look up real GPS coordinates from a hardcoded table of Lviv streets.
//  3. Haversine between two points → distance in km × road factor.
// ──────────────────────────────────────────────────────────────────────────────

// GeoPoint holds WGS-84 coordinates.
type GeoPoint struct {
	Lat float64
	Lon float64
}

// ──────────────────────────────────────────────────────────────────────────────
// Lviv street coordinate table (real GPS)
// ──────────────────────────────────────────────────────────────────────────────

// lvivStreets maps normalized street name keywords to real coordinates.
// Source: OpenStreetMap / Google Maps approximate center of each street.
var lvivStreets = map[string]GeoPoint{
	// ──── Центр ────
	"свободи":          {49.8430, 24.0260},
	"шевченка":         {49.8420, 24.0290},
	"франка":           {49.8380, 24.0220},
	"коперника":        {49.8400, 24.0340},
	"дорошенка":        {49.8410, 24.0300},
	"галицька":         {49.8405, 24.0285},
	"руська":           {49.8380, 24.0310},
	"вірменська":       {49.8395, 24.0315},
	"театральна":       {49.8425, 24.0240},
	"валова":           {49.8370, 24.0310},
	"підвальна":        {49.8390, 24.0280},
	"староєврейська":   {49.8385, 24.0295},
	"краківська":       {49.8415, 24.0270},
	"словацького":      {49.8440, 24.0250},
	"гнатюка":          {49.8398, 24.0260},
	"леонтовича":       {49.8410, 24.0250},
	"курбаса":          {49.8395, 24.0235},
	"федорова":         {49.8385, 24.0330},

	// ──── Університетська / наукова частина ────
	"університетська":  {49.8405, 24.0210},
	"грушевського":     {49.8370, 24.0200},
	"драгоманова":      {49.8380, 24.0250},
	"листопадового чину": {49.8350, 24.0235},
	"крилоса":          {49.8355, 24.0195},

	// ──── Городоцька / вокзал ────
	"городоцька":       {49.8350, 24.0180},
	"хмельницького":    {49.8450, 24.0250},
	"бандери":          {49.8500, 24.0280},
	"мазепи":           {49.8360, 24.0380},
	"чорновола":        {49.8470, 24.0310},
	"шухевича":         {49.8480, 24.0250},
	"витовського":      {49.8320, 24.0050},
	"липинського":      {49.8350, 24.0180},
	"князя романа":     {49.8420, 24.0220},

	// ──── Личаків ────
	"личаківська":      {49.8370, 24.0420},
	"пекарська":        {49.8330, 24.0380},
	"мечникова":        {49.8320, 24.0350},
	"тарнавського":     {49.8370, 24.0120},
	"зелена":           {49.8350, 24.0320},
	"стуса":            {49.8180, 24.0380},
	"стрийський парк":  {49.8250, 24.0350},
	"пасічна":          {49.8050, 24.0050},

	// ──── Сихів ────
	"сихівська":        {49.8000, 24.0600},
	"чернівецька":      {49.8080, 24.0500},
	"червоної калини":  {49.7950, 24.0500},
	"сахарова":         {49.7950, 24.0600},
	"торф'яна":         {49.8020, 24.0650},
	"зубрівська":       {49.7900, 24.0650},
	"патона":           {49.8100, 24.0300},
	"хуторівка":        {49.8030, 24.0550},
	"демнянська":       {49.7980, 24.0580},

	// ──── Стрийська / Наукова ────
	"стрийська":        {49.8150, 24.0200},
	"наукова":          {49.8100, 24.0120},
	"кульпарківська":   {49.8200, 24.0080},
	"героїв упа":       {49.8320, 24.0000},
	"варшавська":       {49.8300, 24.0050},
	"кривоноса":        {49.8280, 24.0180},
	"масарика":         {49.8250, 24.0250},
	"сковороди":        {49.8300, 24.0280},

	// ──── Замарстинів / Промислова ────
	"замарстинівська":  {49.8550, 24.0200},
	"промислова":       {49.8500, 24.0100},
	"богданівська":     {49.8520, 24.0150},
	"левандівська":     {49.8580, 24.0050},
	"городницька":      {49.8510, 24.0080},

	// ──── Рясне / Збоїща ────
	"мальованка":       {49.8280, 24.0400},
	"збоїщанська":      {49.8600, 24.0350},
	"рясне":            {49.8650, 24.0400},

	// ──── Головні / транзитні ────
	"володимира великого": {49.8460, 24.0350},
	"грінченка":        {49.8400, 24.0200},
	"вернадського":     {49.8150, 24.0080},
	"широка":           {49.8330, 24.0330},
	"лемківська":       {49.7980, 24.0450},
	"щирецька":         {49.8050, 24.0200},
	"козельницька":     {49.8330, 24.0450},

	// ──── Львівська область — міста ────
	"дрогобич":         {49.3490, 23.5050},
	"стрий":            {49.2620, 23.8560},
	"борислав":         {49.2870, 23.4310},
	"трускавець":       {49.2810, 23.5060},
	"самбір":           {49.5130, 23.2030},
	"червоноград":      {50.3920, 24.2310},
	"жовква":           {50.0560, 23.9740},
	"золочів":          {49.8060, 24.8980},
	"пустомити":        {49.7230, 23.9300},
	"винники":          {49.8280, 24.1030},
	"городок":          {49.7830, 23.6440},
	"миколаїв":         {49.5280, 24.0040},
	"новий розділ":     {49.4650, 24.1360},
	"яворів":           {49.9370, 23.3900},
	"буськ":            {49.9640, 24.6280},
	"мостиська":        {49.7990, 23.1580},
	"перемишляни":      {49.6710, 24.5420},
	"сокаль":           {50.4860, 24.2800},
	"рава-руська":      {50.2310, 23.6270},
	"бродів":           {50.0800, 25.0120},
	"броди":            {50.0800, 25.0120},
}

// defaultPoint — Lviv city center (Ploshcha Rynok).
var defaultPoint = GeoPoint{Lat: 49.8415, Lon: 24.0320}

// ──────────────────────────────────────────────────────────────────────────────
// Address → GeoPoint
// ──────────────────────────────────────────────────────────────────────────────

// addressToPoint converts an address string to a GeoPoint.
// It looks up the street name in the lvivStreets table.
// If not found, generates a stable hash-based point near Lviv center.
func addressToPoint(address string) GeoPoint {
	lower := strings.ToLower(address)

	// Try to find a known street in the address.
	if pt, ok := findStreet(lower); ok {
		// Add a tiny numeric offset based on house number position
		// so "Шевченка 10" and "Шевченка 200" are slightly different.
		offset := houseNumberOffset(lower)
		return GeoPoint{
			Lat: pt.Lat + offset*0.001, // ~100m variation along street
			Lon: pt.Lon + offset*0.001,
		}
	}

	// Fallback: hash-based point near Lviv center.
	h := sha256.Sum256([]byte(lower))
	latOff := hashToOffset(h[0:8])
	lonOff := hashToOffset(h[8:16])
	return GeoPoint{
		Lat: defaultPoint.Lat + latOff,
		Lon: defaultPoint.Lon + lonOff,
	}
}

// findStreet looks for any known street keyword in the address.
func findStreet(lowerAddr string) (GeoPoint, bool) {
	// Try longest match first for accuracy.
	bestKey := ""
	var bestPt GeoPoint
	for keyword, pt := range lvivStreets {
		if strings.Contains(lowerAddr, keyword) {
			if len(keyword) > len(bestKey) {
				bestKey = keyword
				bestPt = pt
			}
		}
	}
	if bestKey != "" {
		return bestPt, true
	}
	return GeoPoint{}, false
}

// houseNumberOffset extracts a small numeric offset from digits in the address.
// "вул. Шевченка, 317" → offset based on "317".
func houseNumberOffset(lowerAddr string) float64 {
	num := 0
	found := false
	for _, ch := range lowerAddr {
		if ch >= '0' && ch <= '9' {
			num = num*10 + int(ch-'0')
			found = true
		} else if found {
			break // stop at first non-digit after digits
		}
	}
	if !found || num == 0 {
		return 0
	}
	// Normalize to [-0.5, +0.5] range.
	return (float64(num%100) - 50.0) / 100.0
}

// hashToOffset converts 8 bytes to a float64 in [-0.03, +0.03] (~3 km from center).
func hashToOffset(b []byte) float64 {
	n := binary.BigEndian.Uint64(b)
	normalized := float64(n) / float64(math.MaxUint64)
	return (normalized - 0.5) * 0.06
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

// roadFactor: urban roads are ~1.3–1.4× straight line distance.
const roadFactor = 1.35

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

// GetDistanceKm returns the estimated road distance between two addresses.
// Fully offline — instant, deterministic, never fails.
func GetDistanceKm(fromAddress, toAddress string) float64 {
	if fromAddress == toAddress {
		return 0.0
	}

	from := addressToPoint(fromAddress)
	to := addressToPoint(toAddress)

	straight := haversineKm(from, to)
	return straight * roadFactor
}
