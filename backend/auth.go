package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

var hmacSecret []byte

func initAuth() {
	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		secret = "default-dev-secret-change-in-production"
	}
	hmacSecret = []byte(secret)
}

// GenerateToken creates an HMAC-signed token: "userID.signature"
func GenerateToken(userID int) string {
	payload := fmt.Sprintf("%d", userID)
	mac := hmac.New(sha256.New, hmacSecret)
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return payload + "." + sig
}

// VerifyToken validates the token and returns the user ID
func VerifyToken(token string) (int, bool) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return 0, false
	}

	payload := parts[0]
	sig := parts[1]

	mac := hmac.New(sha256.New, hmacSecret)
	mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return 0, false
	}

	userID, err := strconv.Atoi(payload)
	if err != nil {
		return 0, false
	}
	return userID, true
}

// AuthRequired middleware checks for a valid token in the Authorization header
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid token"})
			return
		}

		token := strings.TrimPrefix(header, "Bearer ")
		userID, valid := VerifyToken(token)
		if !valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// AdminRequired middleware checks that the authenticated user is an admin
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}

		var isAdmin bool
		err := db.QueryRow("SELECT is_admin FROM users WHERE id = ?", userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}

		c.Next()
	}
}
