package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"sync/atomic"
	"time"
)

//go:embed web
var webFS embed.FS

func openBrowser(url string) {
	candidates := []string{
		os.Getenv("ProgramFiles(x86)") + `\Microsoft\Edge\Application\msedge.exe`,
		os.Getenv("ProgramFiles") + `\Microsoft\Edge\Application\msedge.exe`,
		os.Getenv("ProgramFiles") + `\Google\Chrome\Application\chrome.exe`,
		os.Getenv("ProgramFiles(x86)") + `\Google\Chrome\Application\chrome.exe`,
		os.Getenv("LocalAppData") + `\Google\Chrome\Application\chrome.exe`,
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			if exec.Command(c, "--app="+url, "--window-size=1280,760").Start() == nil {
				return
			}
		}
	}
	exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}

func main() {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	start := time.Now()
	var lastPing, byeAt int64
	var seen int32

	mux := http.NewServeMux()
	sub, _ := fs.Sub(webFS, "web")
	files := http.FileServer(http.FS(sub))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		files.ServeHTTP(w, r)
	})
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		atomic.StoreInt32(&seen, 1)
		atomic.StoreInt64(&lastPing, time.Now().UnixNano())
		atomic.StoreInt64(&byeAt, 0)
		w.WriteHeader(204)
	})
	mux.HandleFunc("/bye", func(w http.ResponseWriter, r *http.Request) {
		atomic.StoreInt64(&byeAt, time.Now().UnixNano())
		w.WriteHeader(204)
	})

	// Quit when the game window is closed.
	go func() {
		for {
			time.Sleep(time.Second)
			now := time.Now().UnixNano()
			if b := atomic.LoadInt64(&byeAt); b != 0 && now-b > int64(3*time.Second) {
				os.Exit(0)
			}
			if atomic.LoadInt32(&seen) == 1 {
				if now-atomic.LoadInt64(&lastPing) > int64(180*time.Second) {
					os.Exit(0)
				}
			} else if time.Since(start) > 60*time.Second {
				os.Exit(0)
			}
		}
	}()

	go openBrowser(fmt.Sprintf("http://127.0.0.1:%d/", port))
	http.Serve(ln, mux)
}
