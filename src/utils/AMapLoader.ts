export default function AMapLoader(key: string, securityCode: string): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log('AMapLoader: Starting load...');
        if ((window as any).AMap) {
            console.log('AMapLoader: AMap already exists on window.');
            resolve((window as any).AMap);
            return;
        }

        // Avoid duplicate script injection
        if (document.getElementById('amap-js-api')) {
            console.log('AMapLoader: Script tag found, waiting for AMap...');
            // Script exists, wait for it or AMap
            let attempts = 0;
            const checkAMap = setInterval(() => {
                attempts++;
                if ((window as any).AMap) {
                    console.log('AMapLoader: AMap detected!');
                    clearInterval(checkAMap);
                    resolve((window as any).AMap);
                }
                if (attempts > 50) { // 5 seconds timeout
                    console.warn('AMapLoader: Timeout waiting for existing script.');
                    clearInterval(checkAMap);
                    reject(new Error('AMap load timeout'));
                }
            }, 100);
            return;
        }

        console.log('AMapLoader: Injecting new script...');
        // Set security code
        (window as any)._AMapSecurityConfig = {
            securityJsCode: securityCode,
        };

        const script = document.createElement('script');
        script.id = 'amap-js-api';
        script.type = 'text/javascript';
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
        script.onerror = (e) => {
            console.error('AMapLoader: Script load error', e);
            document.head.removeChild(script);
            reject(e);
        };
        script.onload = () => {
            console.log('AMapLoader: Script loaded, AMap available:', !!(window as any).AMap);
            resolve((window as any).AMap);
        };
        document.head.appendChild(script);
    });
}
