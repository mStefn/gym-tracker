package main

import (
	"encoding/json"
	"strconv"
	"strings"
)

// FlexibleInt keeps older frontend payloads compatible with the API.
// It accepts both JSON numbers (123) and numeric strings ("123").
type FlexibleInt int

func (v *FlexibleInt) UnmarshalJSON(data []byte) error {
	value := strings.TrimSpace(string(data))
	if value == "" || value == "null" {
		*v = 0
		return nil
	}

	if strings.HasPrefix(value, "\"") {
		var s string
		if err := json.Unmarshal(data, &s); err != nil {
			return err
		}
		if strings.TrimSpace(s) == "" {
			*v = 0
			return nil
		}
		n, err := strconv.Atoi(s)
		if err != nil {
			return err
		}
		*v = FlexibleInt(n)
		return nil
	}

	n, err := strconv.Atoi(value)
	if err != nil {
		return err
	}
	*v = FlexibleInt(n)
	return nil
}
