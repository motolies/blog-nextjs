import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    // 빌드 산출물 및 외부 파일은 lint 대상에서 제외
    globalIgnores([".next/**", "out/**", "public/**", "claudedocs/**", "next-env.d.ts"]),
    {
        extends: [...nextCoreWebVitals],
        rules: {
            // react-hooks 플러그인 7.x(React Compiler 대비)에서 새로 추가된 룰 —
            // 기존 코드 전면 수정 전까지 경고로 유지 (신규 코드 작성 시에는 준수 권장)
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/static-components": "warn",
            "react-hooks/immutability": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/use-memo": "warn",
            "react-hooks/preserve-manual-memoization": "warn",
        },
    },
]);
