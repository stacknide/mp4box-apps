import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { MediaRoute } from '@routes/media.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new UserRoute(), new AuthRoute(), new MediaRoute()]);

app.listen();
